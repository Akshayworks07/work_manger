import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { VideoStatus } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return "No date";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return dateString;
  }
}

export function isDueSoon(dateString?: string | null): { isDueSoon: boolean; isOverdue: boolean } {
  if (!dateString) return { isDueSoon: false, isOverdue: false };
  const due = new Date(dateString).getTime();
  const now = new Date().setHours(0, 0, 0, 0);
  const diffDays = (due - now) / (1000 * 60 * 60 * 24);
  return {
    isOverdue: diffDays < 0,
    isDueSoon: diffDays >= 0 && diffDays <= 3,
  };
}

export function getStatusBadgeInfo(status: VideoStatus): {
  label: string;
  badgeClass: string;
  dotColor: string;
} {
  switch (status) {
    case "not_started":
      return {
        label: "Not Started",
        badgeClass: "bg-slate-500/10 text-slate-300 border-slate-700/50",
        dotColor: "bg-slate-400",
      };
    case "in_progress":
      return {
        label: "In Progress",
        badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        dotColor: "bg-amber-400 animate-pulse",
      };
    case "review":
      return {
        label: "Review",
        badgeClass: "bg-purple-500/15 text-purple-300 border-purple-500/30",
        dotColor: "bg-purple-400",
      };
    case "revision":
      return {
        label: "Revision",
        badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/30",
        dotColor: "bg-rose-400",
      };
    case "delivered":
      return {
        label: "Delivered",
        badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        dotColor: "bg-emerald-400",
      };
    default:
      return {
        label: status,
        badgeClass: "bg-slate-500/10 text-slate-300 border-slate-700/50",
        dotColor: "bg-slate-400",
      };
  }
}
