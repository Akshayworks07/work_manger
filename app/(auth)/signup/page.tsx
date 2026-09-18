"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Film, Lock, User, AtSign, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { registerDemoUser } from "@/lib/data-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername || cleanUsername.length < 3) {
      setError("Username must be at least 3 characters long");
      return;
    }

    if (!/^[a-z0-9_.-]+$/.test(cleanUsername)) {
      setError("Username may only contain letters, numbers, underscores, and dots");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      // Generated secure internal auth email for Supabase Auth account
      const authEmail = `${cleanUsername}@workmanager.internal`;

      if (!isSupabaseConfigured()) {
        // Register in demo preview store
        registerDemoUser({
          id: "u-" + Date.now(),
          full_name: fullName.trim(),
          username: cleanUsername,
          email: authEmail,
          role: "team-mate",
          avatar_url: null,
          created_at: new Date().toISOString(),
        });

        setSuccess("Account created successfully as Team-mate! Redirecting to dashboard...");
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1000);
        return;
      }

      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: authEmail,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            username: cleanUsername,
            // Role is strictly hardcoded as 'team-mate' by DB trigger
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
        setSuccess("Account registered! You can now log in with your username and password.");
        setIsLoading(false);
        setTimeout(() => {
          router.push("/login");
        }, 1500);
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
            Create Team Account
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Register as a Team-mate to access your assigned video projects
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
                  placeholder="e.g. John Doe"
                  className="pl-9"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="username">Username</Label>
              <div className="relative mt-1.5">
                <AtSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  id="username"
                  type="text"
                  placeholder="e.g. johndoe"
                  className="pl-9"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Used to log into your account. Alphanumeric characters only.
              </p>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 z-10" />
                <PasswordInput
                  id="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 z-10" />
                <PasswordInput
                  id="confirm-password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-3 h-10 font-semibold"
              isLoading={isLoading}
            >
              Create Account <ArrowRight className="ml-2 h-4 w-4" />
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
            Sign in with Username
          </Link>
        </p>
      </div>
    </div>
  );
}
