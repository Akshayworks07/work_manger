"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const GENERIC_LOGIN_ERROR = "Incorrect username or password.";

export async function login(formData: FormData): Promise<{ error: string } | void> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Please enter both a username and password." };
  }

  // Look up the real email behind this username using the admin client
  // (server-only — the browser never sees this lookup or the email itself).
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("email, is_active")
    .eq("username", username)
    .maybeSingle();

  if (!profile) {
    // Same generic message whether the username exists or not,
    // so we don't reveal which usernames are real.
    return { error: GENERIC_LOGIN_ERROR };
  }

  if (!profile.is_active) {
    return { error: "This account has been deactivated. Contact your admin." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password,
  });

  if (error) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

const USERNAME_RULES = /^[a-z0-9_]{3,20}$/;

export async function createTeamMember(formData: FormData): Promise<{ error: string } | { success: true }> {
  // Confirm the caller is actually an admin — never trust the frontend for this.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (callerProfile?.role !== "admin") {
    return { error: "Only admins can create new accounts." };
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "");
  const jobTitle = String(formData.get("jobTitle") ?? "").trim();

  if (!fullName || !username || !email || !password || !role) {
    return { error: "Please fill in all required fields." };
  }
  if (!USERNAME_RULES.test(username)) {
    return { error: "Username must be 3-20 characters: lowercase letters, numbers, underscores only." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return { error: "Password must include an uppercase letter, a lowercase letter, and a number." };
  }
  if (!["admin", "manager", "team_member", "client"].includes(role)) {
    return { error: "Invalid role selected." };
  }

  const admin = createAdminClient();

  const { data: existingUsername } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (existingUsername) {
    return { error: "That username is already taken." };
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !created?.user) {
    return { error: "Unable to create account. That email may already be in use." };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    email,
    username,
    full_name: fullName,
    role,
    job_title: jobTitle || null,
    is_active: true,
  });

  if (profileError) {
    // Roll back the auth account so we don't leave an orphaned login with no profile
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: "Unable to save the new profile. Please try again." };
  }

  await admin.from("activity_logs").insert({
    actor_id: user.id,
    action: "user_created",
    target_type: "profile",
    target_id: created.user.id,
    description: `${fullName} was added as ${role.replace("_", " ")}`,
  });

  return { success: true };
}
