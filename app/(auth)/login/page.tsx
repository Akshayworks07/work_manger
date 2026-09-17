"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Film, Lock, Mail, ArrowRight, Sparkles, AlertCircle } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!isSupabaseConfigured()) {
        // In demo preview mode without live Supabase credentials, route directly into dashboard
        router.push("/");
        router.refresh();
        return;
      }

      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setIsLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    router.push("/");
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
            Video Delivery Tracker
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to manage client projects, kanban boards & deliverables
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
              <Label htmlFor="email">Work Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="producer@studio.com"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-2 h-10 font-semibold"
              isLoading={isLoading}
            >
              Sign In <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          {/* Quick Demo Mode Login */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <button
              onClick={handleDemoLogin}
              type="button"
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-purple-500/40 bg-purple-950/20 px-4 py-2.5 text-xs font-medium text-purple-300 hover:bg-purple-900/30 hover:border-purple-400 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              Explore Instant Preview (Demo Studio Lead)
            </button>
          </div>
        </div>

        {/* Signup Link */}
        <p className="text-center text-xs text-slate-400">
          Need an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-purple-400 hover:text-purple-300 transition-colors"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
