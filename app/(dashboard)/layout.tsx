"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Film,
  LayoutDashboard,
  Users,
  FolderKanban,
  Settings,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  Database,
  ExternalLink,
} from "lucide-react";
import { useApp } from "@/lib/providers";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, isConfigured } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    if (isConfigured) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.push("/login");
  };

  const navItems = [
    {
      name: "Overview",
      href: "/",
      icon: LayoutDashboard,
      active: pathname === "/",
    },
    {
      name: "Clients",
      href: "/clients",
      icon: Users,
      active: pathname.startsWith("/clients"),
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      active: pathname.startsWith("/settings"),
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-slate-800/80">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-md shadow-purple-600/30">
            <Film className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white">
              MotionCraft
            </h1>
            <p className="text-[11px] text-slate-400">Video Delivery Tracker</p>
          </div>
        </div>

        {/* Supabase Status Pill */}
        <div className="px-4 pt-4">
          <div
            className={cn(
              "flex items-center justify-between rounded-xl px-3 py-2 text-xs border",
              isConfigured
                ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                : "bg-amber-950/20 border-amber-500/30 text-amber-300"
            )}
          >
            <span className="flex items-center gap-1.5 font-medium">
              <Database className="h-3.5 w-3.5" />
              {isConfigured ? "Supabase Live" : "Demo Preview"}
            </span>
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                isConfigured ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
              )}
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  item.active
                    ? "bg-purple-600/20 text-purple-200 border border-purple-500/30 shadow-sm"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                )}
              >
                <Icon className={cn("h-4 w-4", item.active && "text-purple-400")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Sign Out */}
        <div className="p-3 border-t border-slate-800/80">
          <div className="flex items-center gap-3 rounded-xl bg-slate-900/60 p-2.5 border border-slate-800/60">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || "User"}
                className="h-9 w-9 rounded-lg object-cover border border-purple-500/40"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600/30 text-xs font-bold text-purple-300">
                {(profile?.full_name || profile?.email || "U").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-semibold text-white">
                {profile?.full_name || "Studio Producer"}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <ShieldCheck className="h-3 w-3 text-purple-400" />
                <span className="capitalize">{profile?.role || "admin"}</span>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Nav Bar */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950 px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600">
              <Film className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-sm text-white">MotionCraft</span>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-800 bg-slate-900/95 p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                  item.active ? "bg-purple-600/20 text-purple-300" : "text-slate-400"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/10"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        )}

        {/* Demo Mode Notice Banner (if Supabase credentials not set yet) */}
        {!isConfigured && (
          <div className="flex items-center justify-between border-b border-amber-500/20 bg-amber-500/10 px-6 py-2.5 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-amber-400" />
              <span>
                <strong>Demo Preview Active:</strong> Exploring with sample data. Connect your live Supabase project by adding your keys to <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[11px]">.env.local</code>.
              </span>
            </div>
            <Link
              href="/settings"
              className="flex items-center gap-1 font-semibold text-amber-300 hover:underline"
            >
              Configure Supabase <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
