import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoutButton } from "@/components/logout-button";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  team_member: "Team Member",
  client: "Client",
};

export default async function DashboardPage() {
  const profile = await getCurrentProfile();

  return (
    <main className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
          <LogoutButton />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Phase 3 — Authentication check</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm text-neutral-700">
            <p>
              Signed in as <span className="font-medium">{profile?.full_name}</span>
            </p>
            <p>
              Username: <span className="font-medium">{profile?.username}</span>
            </p>
            <p>
              Role:{" "}
              <span className="inline-flex items-center rounded-full bg-neutral-900 text-white text-xs font-medium px-2.5 py-1">
                {profile ? ROLE_LABELS[profile.role] : "Unknown"}
              </span>
            </p>
            <p className="text-neutral-400 pt-2">
              The full role-specific dashboard (stats, charts, workload) is built in Phase 4.
            </p>
          </CardContent>
        </Card>

        {profile?.role === "admin" && (
          <Card>
            <CardHeader>
              <CardTitle>Admin</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href="/team"
                className="text-sm font-medium text-neutral-900 underline underline-offset-2"
              >
                Add a team member or client account →
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
