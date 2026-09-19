import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectForm } from "./project-form";

export default async function NewProjectPage() {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin" && profile?.role !== "manager") {
    redirect("/projects");
  }

  const supabase = await createClient();
  const [clientsRes, managersRes, teamRes] = await Promise.all([
    supabase.from("clients").select("id, name").order("name"),
    supabase.from("profiles").select("id, full_name").in("role", ["admin", "manager"]).order("full_name"),
    supabase.from("profiles").select("id, full_name").eq("role", "team_member").eq("is_active", true).order("full_name"),
  ]);

  return (
    <div className="max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>New Project</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm
            clients={(clientsRes.data ?? []).map((c) => ({ id: c.id, label: c.name }))}
            managers={(managersRes.data ?? []).map((m) => ({ id: m.id, label: m.full_name ?? "Unnamed" }))}
            teamMembers={(teamRes.data ?? []).map((t) => ({ id: t.id, label: t.full_name ?? "Unnamed" }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
