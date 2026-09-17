import React from "react";
import Link from "next/link";
import { ArrowRight, Film, CheckCircle2 } from "lucide-react";
import { Client } from "@/lib/types";
import { Progress } from "@/components/ui/progress";

interface ClientSummaryCardProps {
  client: Client;
  totalVideos: number;
  deliveredVideos: number;
  progressPercentage: number;
}

export function ClientSummaryCard({
  client,
  totalVideos,
  deliveredVideos,
  progressPercentage,
}: ClientSummaryCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-sm transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/90">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {client.logo_url ? (
            <img
              src={client.logo_url}
              alt={client.name}
              className="h-10 w-10 rounded-xl object-cover border border-slate-700/60"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/20 text-sm font-bold text-purple-300 border border-purple-500/30">
              {client.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h4 className="font-semibold text-white group-hover:text-purple-300 transition-colors">
              {client.name}
            </h4>
            {client.contact_email && (
              <p className="text-xs text-slate-400">{client.contact_email}</p>
            )}
          </div>
        </div>

        <Link
          href={`/clients/${client.id}`}
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Film className="h-3.5 w-3.5 text-slate-500" />
            Deliverables
          </span>
          <span className="font-medium text-slate-200">
            {deliveredVideos} / {totalVideos} ({progressPercentage}%)
          </span>
        </div>

        <Progress
          value={progressPercentage}
          indicatorClassName={
            progressPercentage === 100
              ? "bg-gradient-to-r from-emerald-500 to-teal-400"
              : undefined
          }
        />
      </div>

      <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800/60 text-xs">
        <span className="text-slate-500">
          {totalVideos - deliveredVideos} in progress
        </span>
        {progressPercentage === 100 ? (
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" /> All Delivered
          </span>
        ) : (
          <Link
            href={`/clients/${client.id}`}
            className="text-purple-400 hover:text-purple-300 font-medium"
          >
            View Projects &rarr;
          </Link>
        )}
      </div>
    </div>
  );
}
