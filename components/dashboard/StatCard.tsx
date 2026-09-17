import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  trend?: string;
  colorScheme?: "purple" | "emerald" | "amber" | "rose" | "blue";
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  colorScheme = "purple",
}: StatCardProps) {
  const schemeStyles = {
    purple: {
      bg: "from-purple-500/10 to-indigo-500/5",
      border: "border-purple-500/20 hover:border-purple-500/40",
      iconBg: "bg-purple-500/15 text-purple-400",
      glow: "hover:shadow-[0_0_20px_-5px_rgba(168,85,247,0.2)]",
    },
    emerald: {
      bg: "from-emerald-500/10 to-teal-500/5",
      border: "border-emerald-500/20 hover:border-emerald-500/40",
      iconBg: "bg-emerald-500/15 text-emerald-400",
      glow: "hover:shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)]",
    },
    amber: {
      bg: "from-amber-500/10 to-orange-500/5",
      border: "border-amber-500/20 hover:border-amber-500/40",
      iconBg: "bg-amber-500/15 text-amber-400",
      glow: "hover:shadow-[0_0_20px_-5px_rgba(245,158,11,0.2)]",
    },
    rose: {
      bg: "from-rose-500/10 to-pink-500/5",
      border: "border-rose-500/20 hover:border-rose-500/40",
      iconBg: "bg-rose-500/15 text-rose-400",
      glow: "hover:shadow-[0_0_20px_-5px_rgba(244,63,94,0.2)]",
    },
    blue: {
      bg: "from-blue-500/10 to-cyan-500/5",
      border: "border-blue-500/20 hover:border-blue-500/40",
      iconBg: "bg-blue-500/15 text-blue-400",
      glow: "hover:shadow-[0_0_20px_-5px_rgba(59,130,246,0.2)]",
    },
  }[colorScheme];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 transition-all duration-300",
        schemeStyles.bg,
        schemeStyles.border,
        schemeStyles.glow
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className={cn("rounded-xl p-2.5", schemeStyles.iconBg)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-white">
          {value}
        </span>
        {trend && (
          <span className="text-xs font-medium text-emerald-400">
            {trend}
          </span>
        )}
      </div>

      {description && (
        <p className="mt-1 text-xs text-slate-400">{description}</p>
      )}
    </div>
  );
}
