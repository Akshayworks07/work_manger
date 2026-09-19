import { cn } from "@/lib/utils";
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from "@/lib/constants/projects";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full text-xs font-medium px-2.5 py-1", STATUS_COLORS[status] ?? "bg-neutral-100 text-neutral-700")}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full text-xs font-medium px-2.5 py-1", PRIORITY_COLORS[priority] ?? "bg-neutral-100 text-neutral-600")}>
      {PRIORITY_LABELS[priority] ?? priority}
    </span>
  );
}
