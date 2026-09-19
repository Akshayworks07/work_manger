export const PROJECT_TYPES = [
  "Social Media", "Movie Promotion", "Event", "Advertisement", "Brand Video",
  "YouTube", "Reel", "Corporate", "Motion Graphics", "Editing", "AI Video", "Other",
];

export const PRIORITIES = ["low", "medium", "high", "urgent"];

export const STATUSES = ["planning", "active", "on_hold", "review", "completed", "archived"];

export const STATUS_LABELS: Record<string, string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On Hold",
  review: "Review",
  completed: "Completed",
  archived: "Archived",
};

export const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const STATUS_COLORS: Record<string, string> = {
  planning: "bg-neutral-100 text-neutral-700",
  active: "bg-blue-100 text-blue-700",
  on_hold: "bg-amber-100 text-amber-700",
  review: "bg-purple-100 text-purple-700",
  completed: "bg-green-100 text-green-700",
  archived: "bg-neutral-100 text-neutral-400",
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-neutral-100 text-neutral-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700",
};
