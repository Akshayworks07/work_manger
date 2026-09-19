"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PROJECT_TYPES, PRIORITIES, STATUSES } from "@/lib/constants/projects";

type ActionResult = { error: string } | { success: true; id?: string };

async function requireStaffRole(): Promise<{ userId: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.role !== "manager") {
    return { error: "Only Admins and Managers can do this." };
  }
  return { userId: user.id };
}

export async function createProject(formData: FormData): Promise<ActionResult> {
  const auth = await requireStaffRole();
  if ("error" in auth) return auth;

  const name = String(formData.get("name") ?? "").trim();
  const clientId = String(formData.get("clientId") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const projectType = String(formData.get("projectType") ?? "");
  const priority = String(formData.get("priority") ?? "medium");
  const startDate = String(formData.get("startDate") ?? "") || null;
  const deadline = String(formData.get("deadline") ?? "") || null;
  const managerId = String(formData.get("managerId") ?? "") || null;
  const teamMemberIds = formData.getAll("teamMembers").map(String).filter(Boolean);

  if (!name) return { error: "Project name is required." };
  if (!clientId) return { error: "Please select a client." };
  if (!PROJECT_TYPES.includes(projectType)) return { error: "Please select a valid project type." };
  if (!PRIORITIES.includes(priority)) return { error: "Invalid priority." };
  if (startDate && deadline && startDate > deadline) {
    return { error: "Deadline can't be before the start date." };
  }

  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      name,
      client_id: clientId,
      description: description || null,
      project_type: projectType,
      priority,
      status: "planning",
      start_date: startDate,
      deadline,
      manager_id: managerId,
    })
    .select("id")
    .single();

  if (error || !project) {
    return { error: "Unable to create the project. Please check the details and try again." };
  }

  if (teamMemberIds.length > 0) {
    await supabase.from("project_members").insert(
      teamMemberIds.map((profileId) => ({ project_id: project.id, profile_id: profileId }))
    );
  }

  await supabase.from("activity_logs").insert({
    actor_id: auth.userId,
    action: "project_created",
    target_type: "project",
    target_id: project.id,
    description: `Project "${name}" was created`,
  });

  revalidatePath("/projects");
  return { success: true, id: project.id };
}

export async function updateProject(projectId: string, formData: FormData): Promise<ActionResult> {
  const auth = await requireStaffRole();
  if ("error" in auth) return auth;

  const supabase = await createClient();

  const { data: before } = await supabase
    .from("projects")
    .select("status, priority, deadline")
    .eq("id", projectId)
    .single();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const projectType = String(formData.get("projectType") ?? "");
  const priority = String(formData.get("priority") ?? "medium");
  const status = String(formData.get("status") ?? "planning");
  const startDate = String(formData.get("startDate") ?? "") || null;
  const deadline = String(formData.get("deadline") ?? "") || null;
  const managerId = String(formData.get("managerId") ?? "") || null;

  if (!name) return { error: "Project name is required." };
  if (!PROJECT_TYPES.includes(projectType)) return { error: "Please select a valid project type." };
  if (!PRIORITIES.includes(priority)) return { error: "Invalid priority." };
  if (!STATUSES.includes(status)) return { error: "Invalid status." };
  if (startDate && deadline && startDate > deadline) {
    return { error: "Deadline can't be before the start date." };
  }

  const { error } = await supabase
    .from("projects")
    .update({
      name,
      description: description || null,
      project_type: projectType,
      priority,
      status,
      start_date: startDate,
      deadline,
      manager_id: managerId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  if (error) return { error: "Unable to save changes. Please try again." };

  // Log meaningful field changes for the audit trail
  const changes: { field: string; from: string | null; to: string | null }[] = [];
  if (before) {
    if (before.status !== status) changes.push({ field: "status", from: before.status, to: status });
    if (before.priority !== priority) changes.push({ field: "priority", from: before.priority, to: priority });
    if (before.deadline !== deadline) changes.push({ field: "deadline", from: before.deadline, to: deadline });
  }
  for (const c of changes) {
    await supabase.from("activity_logs").insert({
      actor_id: auth.userId,
      action: "project_updated",
      target_type: "project",
      target_id: projectId,
      description: `Project "${name}": ${c.field} changed from ${c.from ?? "none"} to ${c.to ?? "none"}`,
    });
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function archiveProject(projectId: string): Promise<ActionResult> {
  const auth = await requireStaffRole();
  if ("error" in auth) return auth;

  const supabase = await createClient();
  const { data: project } = await supabase.from("projects").select("name").eq("id", projectId).single();

  const { error } = await supabase
    .from("projects")
    .update({ is_archived: true, status: "archived", updated_at: new Date().toISOString() })
    .eq("id", projectId);

  if (error) return { error: "Unable to archive the project." };

  await supabase.from("activity_logs").insert({
    actor_id: auth.userId,
    action: "project_archived",
    target_type: "project",
    target_id: projectId,
    description: `Project "${project?.name ?? ""}" was archived`,
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function unarchiveProject(projectId: string): Promise<ActionResult> {
  const auth = await requireStaffRole();
  if ("error" in auth) return auth;

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ is_archived: false, status: "active", updated_at: new Date().toISOString() })
    .eq("id", projectId);

  if (error) return { error: "Unable to restore the project." };
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function addProjectMember(projectId: string, profileId: string): Promise<ActionResult> {
  const auth = await requireStaffRole();
  if ("error" in auth) return auth;

  const supabase = await createClient();
  const { error } = await supabase.from("project_members").insert({ project_id: projectId, profile_id: profileId });
  if (error) return { error: "Unable to add that member (they may already be on this project)." };

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function removeProjectMember(projectId: string, profileId: string): Promise<ActionResult> {
  const auth = await requireStaffRole();
  if ("error" in auth) return auth;

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("profile_id", profileId);
  if (error) return { error: "Unable to remove that member." };

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function grantClientAccess(projectId: string, clientProfileId: string): Promise<ActionResult> {
  const auth = await requireStaffRole();
  if ("error" in auth) return auth;

  const supabase = await createClient();
  const { error } = await supabase
    .from("client_project_access")
    .insert({ project_id: projectId, client_profile_id: clientProfileId });
  if (error) return { error: "Unable to share with that client (they may already have access)." };

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function revokeClientAccess(projectId: string, clientProfileId: string): Promise<ActionResult> {
  const auth = await requireStaffRole();
  if ("error" in auth) return auth;

  const supabase = await createClient();
  const { error } = await supabase
    .from("client_project_access")
    .delete()
    .eq("project_id", projectId)
    .eq("client_profile_id", clientProfileId);
  if (error) return { error: "Unable to revoke access." };

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function createClientRecord(formData: FormData): Promise<ActionResult> {
  const auth = await requireStaffRole();
  if ("error" in auth) return auth;

  const name = String(formData.get("clientName") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();
  if (!name) return { error: "Client name is required." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({ name, contact_email: contactEmail || null })
    .select("id")
    .single();

  if (error || !data) return { error: "Unable to create client." };
  return { success: true, id: data.id };
}
