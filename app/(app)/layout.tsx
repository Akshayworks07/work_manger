import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { Sidebar } from "@/components/sidebar";
import { LogoutButton } from "@/components/logout-button";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  team_member: "Team Member",
  client: "Client",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  // Belt-and-suspenders: middleware already blocks unauthenticated requests,
  // this is the server-side fallback in case a profile row is somehow missing.
  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="md:flex md:min-h-screen bg-neutral-50">
      <Sidebar role={profile.role} />
      <div className="flex-1 min-w-0">
        <header className="hidden md:flex items-center justify-between border-b border-neutral-200 bg-white h-14 px-6">
          <div className="text-sm text-neutral-500">
            {profile.full_name}
            <span className="mx-2 text-neutral-300">·</span>
            <span className="text-neutral-400">{ROLE_LABELS[profile.role]}</span>
          </div>
          <LogoutButton />
        </header>
        <div className="p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
