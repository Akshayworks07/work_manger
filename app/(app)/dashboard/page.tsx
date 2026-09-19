import { getCurrentProfile } from "@/lib/auth/current-profile";
import { getDashboardData } from "@/lib/dashboard/queries";
import { StatCard } from "@/components/stat-card";
import { SimpleBarChart } from "@/components/charts/simple-bar-chart";

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const data = await getDashboardData(profile.id, profile.role);
  const firstName = profile.full_name?.split(" ")[0] ?? profile.username;

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          {profile.role === "client" ? "Your Projects" : `Welcome back, ${firstName}`}
        </h1>
        <p className="text-sm text-neutral-500">
          {new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* CLIENT: minimal, read-only, project-level only */}
      {profile.role === "client" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="Shared Projects" value={data.totalProjects} />
          <StatCard label="Active" value={data.activeProjects} />
          <StatCard label="Completed" value={data.completedProjects} />
        </div>
      )}

      {/* TEAM MEMBER: personal workload focus */}
      {profile.role === "team_member" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard label="My Tasks" value={data.myTasks} />
            <StatCard label="Due Today" value={data.dueToday} accent={data.dueToday > 0 ? "warning" : "default"} />
            <StatCard label="Due This Week" value={data.dueThisWeek} />
            <StatCard label="Overdue" value={data.overdueTasks} accent={data.overdueTasks > 0 ? "danger" : "default"} />
            <StatCard label="Pending Review" value={data.pendingReviews} />
            <StatCard label="Active Projects" value={data.activeProjects} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <SimpleBarChart title="My Tasks by Status" data={data.tasksByStatus} emptyMessage="No tasks yet." />
          </div>
        </>
      )}

      {/* ADMIN / MANAGER: full org-wide view */}
      {(profile.role === "admin" || profile.role === "manager") && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard label="Total Projects" value={data.totalProjects} />
            <StatCard label="Active Projects" value={data.activeProjects} />
            <StatCard label="Completed Projects" value={data.completedProjects} />
            <StatCard label="Overdue Tasks" value={data.overdueTasks} accent={data.overdueTasks > 0 ? "danger" : "default"} />
            <StatCard label="Due Today" value={data.dueToday} accent={data.dueToday > 0 ? "warning" : "default"} />
            <StatCard label="Due This Week" value={data.dueThisWeek} />
            <StatCard label="Pending Reviews" value={data.pendingReviews} />
            <StatCard label="Attendance Today" value={data.attendanceToday} />
            <StatCard label="My Tasks" value={data.myTasks} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <SimpleBarChart title="Tasks by Status" data={data.tasksByStatus} emptyMessage="No tasks created yet — this fills in from Phase 6." />
            <SimpleBarChart title="Projects by Status" data={data.projectsByStatus} emptyMessage="No projects yet." />
          </div>
        </>
      )}
    </div>
  );
}
