import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { createClient } from "@/lib/supabase/server";
import { ProjectDetail } from "./project-detail";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();

  // RLS decides whether this row comes back at all — if the viewer isn't
  // allowed to see this project (wrong team, not shared with this client),
  // this returns null and we show a normal "not found" page, not an error
  // that reveals the project exists.
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, description, project_type, priority, status, start_date, deadline, manager_id, is_archived, clients(name)")
    .eq("id", id)
    .maybeSingle();

  if (!project) notFound();

  const canManage = profile.role === "admin" || profile.role === "manager";
  const isClientView = profile.role === "client";

  const [managersRes, currentMembersRes, allTeamRes, clientAccessRes, allClientsRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name").in("role", ["admin", "manager"]),
    supabase.from("project_members").select("profile_id, profiles(full_name)").eq("project_id", id),
    canManage ? supabase.from("profiles").select("id, full_name").eq("role", "team_member").eq("is_active", true) : Promise.resolve({ data: [] }),
    canManage ? supabase.from("client_project_access").select("client_profile_id, profiles(full_name)").eq("project_id", id) : Promise.resolve({ data: [] }),
    canManage ? supabase.from("profiles").select("id, full_name").eq("role", "client").eq("is_active", true) : Promise.resolve({ data: [] }),
  ]);

  const currentMemberIds = new Set((currentMembersRes.data ?? []).map((m) => m.profile_id));
  const currentClientIds = new Set((clientAccessRes.data ?? []).map((c) => c.client_profile_id));
  const client = Array.isArray(project.clients) ? project.clients[0] : project.clients;

  return (
    <ProjectDetail
      project={{
        id: project.id,
        name: project.name,
        description: project.description,
        project_type: project.project_type,
        priority: project.priority,
        status: project.status,
        start_date: project.start_date,
        deadline: project.deadline,
        manager_id: project.manager_id,
        is_archived: project.is_archived,
        client_name: client && "name" in client ? client.name : "No client",
      }}
      canManage={canManage}
      isClientView={isClientView}
      managers={(managersRes.data ?? []).map((m) => ({ id: m.id, label: m.full_name ?? "Unnamed" }))}
      currentMembers={(currentMembersRes.data ?? []).map((m) => {
        const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
        return { id: m.profile_id, label: p && "full_name" in p ? p.full_name ?? "Unnamed" : "Unnamed" };
      })}
      availableTeamMembers={(allTeamRes.data ?? [])
        .filter((t) => !currentMemberIds.has(t.id))
        .map((t) => ({ id: t.id, label: t.full_name ?? "Unnamed" }))}
      currentClientAccess={(clientAccessRes.data ?? []).map((c) => {
        const p = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
        return { id: c.client_profile_id, label: p && "full_name" in p ? p.full_name ?? "Unnamed" : "Unnamed" };
      })}
      availableClients={(allClientsRes.data ?? [])
        .filter((c) => !currentClientIds.has(c.id))
        .map((c) => ({ id: c.id, label: c.full_name ?? "Unnamed" }))}
    />
  );
}
