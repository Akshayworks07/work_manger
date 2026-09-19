import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, PriorityBadge } from "@/components/badges";
import { FolderKanban } from "lucide-react";

export default async function ProjectsPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, project_type, status, priority, deadline, is_archived, clients(name)")
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  const canCreate = profile.role === "admin" || profile.role === "manager";

  return (
    <div className="flex flex-col gap-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Projects</h1>
        {canCreate && (
          <Link href="/projects/new">
            <Button>New Project</Button>
          </Link>
        )}
      </div>

      {!projects || projects.length === 0 ? (
        <Card>
          <CardContent className="p-10 flex flex-col items-center text-center gap-2">
            <FolderKanban className="h-8 w-8 text-neutral-300" />
            <p className="text-sm text-neutral-500">
              {canCreate
                ? "No projects yet. Create your first one to get started."
                : "No projects have been shared with you yet."}
            </p>
            {canCreate && (
              <Link href="/projects/new">
                <Button variant="outline" size="sm" className="mt-2">
                  Create a project
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => {
            const client = Array.isArray(p.clients) ? p.clients[0] : p.clients;
            return (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <Card className="h-full hover:border-neutral-300 transition-colors">
                  <CardContent className="p-4 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-neutral-900 leading-snug">{p.name}</h3>
                      <PriorityBadge priority={p.priority} />
                    </div>
                    <p className="text-xs text-neutral-400">
                      {client && "name" in client ? client.name : "No client"}
                      {p.project_type ? ` · ${p.project_type}` : ""}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <StatusBadge status={p.status} />
                      {p.deadline && (
                        <span className="text-xs text-neutral-400">
                          Due {new Date(p.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
