import "server-only";
import { createClient } from "@/lib/supabase/server";

export type Role = "admin" | "manager" | "team_member" | "client";

export interface CurrentProfile {
  id: string;
  username: string;
  full_name: string | null;
  role: Role;
  job_title: string | null;
  department: string | null;
}

/**
 * Reads the logged-in user's profile, including their role.
 * Returns null if nobody is logged in — callers decide what to do
 * (middleware already keeps unauthenticated users off protected pages,
 * this is the second, server-side check for role-specific logic).
 */
export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, full_name, role, job_title, department")
    .eq("id", user.id)
    .single();

  return (profile as CurrentProfile) ?? null;
}
