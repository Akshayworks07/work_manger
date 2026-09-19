"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  Columns3,
  Calendar,
  Clock,
  Activity,
  BarChart3,
  Users,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/auth/current-profile";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "team_member", "client"] },
  { href: "/projects", label: "Projects", icon: FolderKanban, roles: ["admin", "manager", "team_member", "client"] },
  { href: "/tasks", label: "My Tasks", icon: ListChecks, roles: ["admin", "manager", "team_member"] },
  { href: "/kanban", label: "Kanban", icon: Columns3, roles: ["admin", "manager", "team_member"] },
  { href: "/calendar", label: "Calendar", icon: Calendar, roles: ["admin", "manager", "team_member"] },
  { href: "/attendance", label: "Attendance", icon: Clock, roles: ["admin", "manager", "team_member"] },
  { href: "/activity", label: "Activity", icon: Activity, roles: ["admin", "manager"] },
  { href: "/reports", label: "Reports", icon: BarChart3, roles: ["admin", "manager"] },
  { href: "/team", label: "Team", icon: Users, roles: ["admin"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["admin", "manager", "team_member", "client"] },
];

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  const linkClasses = (href: string) =>
    cn(
      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      pathname === href
        ? "bg-neutral-900 text-white"
        : "text-neutral-600 hover:bg-neutral-100"
    );

  return (
    <>
      {/* Mobile top bar toggle */}
      <div className="md:hidden flex items-center justify-between border-b border-neutral-200 bg-white px-4 h-14">
        <span className="font-semibold text-neutral-900 text-sm">Production Manager</span>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="p-2 -mr-2 text-neutral-600"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar: fixed on desktop, slide-down on mobile */}
      <nav
        className={cn(
          "md:flex md:flex-col md:w-60 md:shrink-0 md:border-r md:border-neutral-200 md:bg-white md:h-screen md:sticky md:top-0 md:p-4",
          mobileOpen ? "flex flex-col p-4 border-b border-neutral-200 bg-white" : "hidden"
        )}
      >
        <div className="hidden md:block px-2 pb-4">
          <span className="font-semibold text-neutral-900 text-sm">Production Manager</span>
        </div>
        <div className="flex flex-col gap-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={linkClasses(item.href)}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
