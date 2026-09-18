"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Film, Lock, AtSign, ArrowRight, Sparkles, AlertCircle, Shield, User } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getUserEmailByUsername, setDemoProfile } from "@/lib/data-store";
import { MOCK_PROFILE, MOCK_TEAM_MATE } from "@/lib/mock-data";
import { useApp } from "@/lib/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const { refreshProfile } = useApp();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const cleanUsername = username.trim().toLowerCase();

    if (!cleanUsername) {
      setError("Please enter your username");
      setIsLoading(false);
      return;
    }

    if (!password) {
      setError("Please enter your password");
      setIsLoading(false);
      return;
    }

    try {
      if (!isSupabaseConfigured()) {
        // Demo mode lookup
        const email = await getUserEmailByUsername(cleanUsername);
        if (!email && cleanUsername !== "alex" && cleanUsername !== "samtaylor") {
          setError("Invalid username or password");
          setIsLoading(false);
          return;
        }

        // Set demo user profile
        if (cleanUsername === "samtaylor") {
          setDemoProfile(MOCK_TEAM_MATE);
        } else {
          setDemoProfile(MOCK_PROFILE);
        }

        await refreshProfile();
        router.push("/");
        router.refresh();
        return;
      }

      // Live Supabase Auth: resolve username -> account email
      const accountEmail = await getUserEmailByUsername(cleanUsername);

      if (!accountEmail) {
        setError("Invalid username or password");
        setIsLoading(false);
        return;
      }

      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: accountEmail,
        password,
      });

      if (signInError) {
        setError("Invalid username or password");
        setIsLoading(false);
        return;
      }

      await refreshProfile();
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "An error occurred during login");
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (role: "admin" | "team-mate") => {
    if (role === "admin") {
      setDemoProfile(MOCK_PROFILE);
    } else {
      setDemoProfile(MOCK_TEAM_MATE);
    }
    await refreshProfile();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
      {/* Glow background accent */}
      <div className="pointer-events-none absolute h-96 w-96 rounded-full bg-purple-600/15 blur-[120px] top-1/4" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-xl shadow-purple-600/20 border border-purple-500/30">
            <Film className="h-7 w-7 text-white" />
          </div>
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-white">
            Work Manager
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Sign in with your username to access projects and deliverables
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <div className="relative mt-1.5">
                <AtSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  id="username"
                  type="text"
                  placeholder="e.g. alex or samtaylor"
                  className="pl-9"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 z-10" />
                <PasswordInput
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-2 h-10 font-semibold"
              isLoading={isLoading}
            >
              Login <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          {/* Quick Demo Preview Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
              1-Click Demo Testing
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleQuickDemo("admin")}
                type="button"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-950/20 px-3 py-2 text-xs font-medium text-purple-300 hover:bg-purple-900/30 transition-colors"
              >
                <Shield className="h-3.5 w-3.5 text-purple-400" />
                As Admin
              </button>

              <button
                onClick={() => handleQuickDemo("team-mate")}
                type="button"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-950/20 px-3 py-2 text-xs font-medium text-blue-300 hover:bg-blue-900/30 transition-colors"
              >
                <User className="h-3.5 w-3.5 text-blue-400" />
                As Team-mate
              </button>
            </div>
          </div>
        </div>

        {/* Signup Link */}
        <p className="text-center text-xs text-slate-400">
          Need an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-purple-400 hover:text-purple-300 transition-colors"
          >
            Create a Team-mate account
          </Link>
        </p>
      </div>
    </div>
  );
}
