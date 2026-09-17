"use client";

import React, { useState } from "react";
import {
  User,
  Shield,
  Database,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/lib/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const { profile, isConfigured } = useApp();
  const [copied, setCopied] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || "Alex Morgan");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(`-- Run schema.sql from the project root in Supabase SQL Editor`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Workspace Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your producer profile, credentials, and Supabase database connection.
        </p>
      </div>

      {/* Supabase Connection Status Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                isConfigured
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-400"
              }`}
            >
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white">
                Supabase Database Backend
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isConfigured
                  ? "Connected to live PostgreSQL database with Row Level Security."
                  : "Currently running in interactive Demo Preview mode."}
              </p>
            </div>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold border ${
              isConfigured
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                : "bg-amber-500/15 border-amber-500/30 text-amber-300"
            }`}
          >
            {isConfigured ? "Connected" : "Demo Mode"}
          </span>
        </div>

        <div className="mt-6 space-y-3 text-xs text-slate-300 pt-5 border-t border-slate-800/80">
          <div className="rounded-xl bg-slate-950 p-4 border border-slate-800">
            <h4 className="font-semibold text-slate-200 mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-400" /> Connecting to your own Supabase project:
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
              <li>
                Create a project on{" "}
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-purple-400 hover:underline inline-flex items-center gap-1"
                >
                  supabase.com <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                Go to <strong>SQL Editor</strong> &rarr; run the provided{" "}
                <code className="rounded bg-slate-900 px-1.5 py-0.5 text-purple-300">
                  supabase/schema.sql
                </code>{" "}
                migration script.
              </li>
              <li>
                In <strong>Project Settings &rarr; API</strong>, copy your Project URL and Anon key into{" "}
                <code className="rounded bg-slate-900 px-1.5 py-0.5 text-purple-300">
                  .env.local
                </code>
                .
              </li>
              <li>
                Sign up via <code className="rounded bg-slate-900 px-1.5 py-0.5 text-purple-300">/signup</code> and ensure your role is set to <code className="rounded bg-slate-900 px-1.5 py-0.5 text-purple-300">&apos;admin&apos;</code> in the profiles table!
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Profile Settings Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Producer Profile</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Personalized display details and delivery contact information
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Profile settings updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <Label htmlFor="prof-name">Full Name</Label>
            <Input
              id="prof-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="prof-email">Email Address</Label>
            <Input
              id="prof-email"
              value={profile?.email || "alex@motioncraft.studio"}
              disabled
              className="mt-1.5 opacity-60 cursor-not-allowed"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Managed through Supabase Auth authentication provider.
            </p>
          </div>

          <div>
            <Label htmlFor="prof-avatar">Avatar Image URL</Label>
            <Input
              id="prof-avatar"
              placeholder="https://..."
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div className="pt-2">
            <Label>Access Role</Label>
            <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs">
              <Shield className="h-4 w-4 text-purple-400" />
              <span className="font-semibold text-white capitalize">
                {profile?.role || "admin"}
              </span>
              <span className="text-slate-500">
                — Full administrative access to clients, projects, and kanban cards.
              </span>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
