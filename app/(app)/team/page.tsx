import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddMemberForm } from "./add-member-form";

export default async function TeamPage() {
  const profile = await getCurrentProfile();

  // Server-side gate — this check happens before any protected data loads,
  // not just a hidden button in the UI.
  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: members } = await supabase
    .from("profiles")
    .select("full_name, username, role, job_title, is_active")
    .order("full_name");

  return (
    <div className="max-w-2xl flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-neutral-900">Team</h1>

      <Card>
        <CardHeader>
          <CardTitle>Add a team member or client</CardTitle>
        </CardHeader>
        <CardContent>
          <AddMemberForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current accounts</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {members?.map((m) => (
            <div
              key={m.username}
              className="flex items-center justify-between text-sm border-b border-neutral-100 py-2 last:border-0"
            >
              <div>
                <p className="font-medium text-neutral-900">{m.full_name}</p>
                <p className="text-neutral-400">@{m.username}{m.job_title ? ` · ${m.job_title}` : ""}</p>
              </div>
              <span className="text-xs font-medium text-neutral-500 uppercase">
                {m.role.replace("_", " ")}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
