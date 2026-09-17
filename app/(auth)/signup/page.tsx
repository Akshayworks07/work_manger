"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Film, Lock, Mail, User, Shield, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "client">("admin");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (!isSupabaseConfigured()) {
        setSuccess("Account configured! Redirecting to dashboard preview...");
        setTimeout(() => {
          router.push("/");
        }, 1200);
        return;
      }

      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }

      if (data.session) {
        router.push("/");
        router.refresh();
      } else {
        setSuccess("Account created! Please check your email to confirm your sign up, then log in.");
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during signup");
      setIsLoading(false);
    }
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
            Create an Account
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Get started with Video Delivery Tracker
          </p>
        </div>

        {/* Signup Card */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <Label htmlFor="full-name">Full Name</Label>
              <div className="relative mt-1.5">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  id="full-name"
                  type="text"
                  placeholder="Alex Morgan"
                  className="pl-9"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
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
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  minLength={6}
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="role">Initial Account Role</Label>
              <div className="relative mt-1.5">
                <Shield className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as "admin" | "client")}
                  className="flex h-9 w-full rounded-lg border border-slate-700/80 bg-slate-900/80 pl-9 pr-3 py-1 text-sm text-slate-100 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                >
                  <option value="admin">Admin / Video Studio Producer</option>
                  <option value="client">Client (Reviewer / Brand Lead)</option>
                </select>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Admins have full project management and kanban access.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full mt-3 h-10 font-semibold"
              isLoading={isLoading}
            >
              Sign Up <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </div>

        {/* Login Link */}
        <p className="text-center text-xs text-slate-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-purple-400 hover:text-purple-300 transition-colors"
          >
            Sign in instead
          </Link>
        </p>
      </div>
    </div>
  );
}
