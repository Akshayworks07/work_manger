import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/auth/current-profile";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function endOfWeekISO() {
  const d = new Date();
  const day = d.getDay(); // 0 = Sunday
  const daysUntilSunday = 7 - day;
  d.setDate(d.getDate() + daysUntilSunday);
  return d.toISOString().slice(0, 10);
}

export interface DashboardData {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  overdueTasks: number;
  dueToday: number;
  dueThisWeek: number;
  myTasks: number;
  pendingReviews: number;
  attendanceToday: number;
  tasksByStatus: { name: string; value: number }[];
  projectsByStatus: { name: string; value: number }[];
}

const PROJECT_STATUS_LABELS: Record<string, string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On Hold",
  review: "Review",
  completed: "Completed",
  archived: "Archived",
};

export async function getDashboardData(userId: string, role: Role): Promise<DashboardData> {
  const supabase = await createClient();
  const today = todayISO();
  const weekEnd = endOfWeekISO();

  // Every query below runs as the logged-in user — RLS decides what rows
  // come back, exactly like it will for every real user of the app.
  const [
    projectsRes,
    tasksRes,
    taskStatusesRes,
    attendanceTodayRes,
  ] = await Promise.all([
    supabase.from("projects").select("id, status, is_archived"),
    supabase
      .from("tasks")
      .select("id, due_date, assigned_to, status_id, task_statuses(name)")
      .then((r) => r), // tasks joined with their status name
    supabase.from("task_statuses").select("id, name, position").order("position"),
    role === "admin" || role === "manager"
      ? supabase.from("attendance").select("id").eq("date", today).in("status", ["present", "late"])
      : Promise.resolve({ data: [] as { id: string }[] }),
  ]);

  const projects = projectsRes.data ?? [];
  const tasks = (tasksRes.data ?? []) as unknown as {
    id: string;
    due_date: string | null;
    assigned_to: string | null;
    status_id: string;
    task_statuses: { name: string } | null;
  }[];
  const statuses = taskStatusesRes.data ?? [];

  const activeProjects = projects.filter((p) => p.status === "active" && !p.is_archived).length;
  const completedProjects = projects.filter((p) => p.status === "completed").length;

  const overdueTasks = tasks.filter(
    (t) => t.due_date && t.due_date < today && t.task_statuses?.name !== "Completed"
  ).length;
  const dueToday = tasks.filter((t) => t.due_date === today).length;
  const dueThisWeek = tasks.filter((t) => t.due_date && t.due_date >= today && t.due_date <= weekEnd).length;
  const myTasks = tasks.filter((t) => t.assigned_to === userId).length;
  const pendingReviews = tasks.filter((t) => t.task_statuses?.name === "Review").length;

  const tasksByStatus = statuses.map((s) => ({
    name: s.name,
    value: tasks.filter((t) => t.status_id === s.id).length,
  }));

  const projectStatusCounts: Record<string, number> = {};
  for (const p of projects) {
    projectStatusCounts[p.status] = (projectStatusCounts[p.status] ?? 0) + 1;
  }
  const projectsByStatus = Object.entries(PROJECT_STATUS_LABELS).map(([key, name]) => ({
    name,
    value: projectStatusCounts[key] ?? 0,
  }));

  return {
    totalProjects: projects.filter((p) => !p.is_archived).length,
    activeProjects,
    completedProjects,
    overdueTasks,
    dueToday,
    dueThisWeek,
    myTasks,
    pendingReviews,
    attendanceToday: attendanceTodayRes.data?.length ?? 0,
    tasksByStatus,
    projectsByStatus,
  };
}
