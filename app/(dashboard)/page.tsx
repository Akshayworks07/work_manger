"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Film,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  RefreshCw,
  Calendar,
  ArrowRight,
  TrendingUp,
  FolderKanban,
  User,
  Sparkles,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  getDashboardStats,
  fetchAllVideos,
  fetchProjects,
  updateVideoStatus,
} from "@/lib/data-store";
import { useApp } from "@/lib/providers";
import { StatCard } from "@/components/dashboard/StatCard";
import { ClientSummaryCard } from "@/components/dashboard/ClientSummaryCard";
import { StatusPieChart } from "@/components/charts/StatusPieChart";
import { Button } from "@/components/ui/button";
import { formatDate, isDueSoon, getStatusBadgeInfo, cn } from "@/lib/utils";
import { Video, VideoStatus } from "@/lib/types";

export default function DashboardPage() {
  const { profile } = useApp();
  const queryClient = useQueryClient();
  const isTeamMate = profile?.role === "team-mate";

  // Admin Dashboard Queries
  const {
    data: adminData,
    isLoading: adminLoading,
    refetch: refetchAdmin,
    isFetching: adminFetching,
  } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => getDashboardStats(profile),
    enabled: !isTeamMate,
  });

  // Team-mate Dashboard Queries
  const {
    data: allVideos = [],
    isLoading: videosLoading,
    refetch: refetchVideos,
    isFetching: videosFetching,
  } = useQuery({
    queryKey: ["all-videos"],
    queryFn: fetchAllVideos,
  });

  const {
    data: allProjects = [],
    isLoading: projectsLoading,
    refetch: refetchProjects,
    isFetching: projectsFetching,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: () => fetchProjects(),
  });

  const [updatingVideoId, setUpdatingVideoId] = useState<string | null>(null);

  // Status update handler for team-mates
  const handleStatusChange = async (video: Video, newStatus: VideoStatus) => {
    if (video.status === newStatus) return;
    setUpdatingVideoId(video.id);

    try {
      if (newStatus === "delivered") {
        try {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 },
            colors: ["#10b981", "#34d399", "#6ee7b7", "#8b5cf6"],
          });
        } catch {}
      }

      await updateVideoStatus(video.id, newStatus);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["all-videos"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["projects"] }),
        queryClient.invalidateQueries({ queryKey: ["project-kanban"] }),
      ]);
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingVideoId(null);
    }
  };

  const handleRefreshAll = () => {
    if (isTeamMate) {
      refetchVideos();
      refetchProjects();
    } else {
      refetchAdmin();
    }
  };

  const isFetching = isTeamMate
    ? videosFetching || projectsFetching
    : adminFetching;

  // ============================================================================
  // TEAM-MATE VIEW
  // ============================================================================
  if (isTeamMate) {
    const currentUserId = profile?.id;
    // Deliverables explicitly assigned to this team-mate
    const myAssignedVideos = allVideos.filter(
      (v) => v.assigned_to === currentUserId
    );
    // If a brand-new demo user has no videos directly assigned yet, show all active deliverables
    const displayVideos =
      myAssignedVideos.length > 0 ? myAssignedVideos : allVideos;
    const isShowingAllFallback = myAssignedVideos.length === 0;

    const myDelivered = displayVideos.filter(
      (v) => v.status === "delivered"
    ).length;
    const myInProgress = displayVideos.filter(
      (v) => v.status === "in_progress"
    ).length;
    const myPendingReview = displayVideos.filter(
      (v) => v.status === "review" || v.status === "revision"
    ).length;
    const myNeedingWork = displayVideos.filter(
      (v) => v.status === "not_started"
    ).length;

    // Projects relevant to team-mate
    const userProjectIds = new Set(displayVideos.map((v) => v.project_id));
    const myProjects = allProjects.filter(
      (p) => userProjectIds.has(p.id) || isShowingAllFallback
    );

    // Deadlines this week for team-mate
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);

    const myUpcomingDeadlines = displayVideos.filter((v) => {
      if (!v.due_date || v.status === "delivered") return false;
      const due = new Date(v.due_date);
      return due >= now && due <= nextWeek;
    });

    return (
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Team-mate Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                My Workspace
              </h1>
              <span className="rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-xs font-semibold text-blue-300">
                Team-mate
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Welcome back,{" "}
              <strong className="text-slate-200">
                {profile?.full_name || profile?.username}
              </strong>
              . Track your assigned production deliverables, upcoming deadlines,
              and update statuses.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              disabled={isFetching}
              className="gap-2"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Informational banner if fallback is shown for brand new account */}
        {isShowingAllFallback && allVideos.length > 0 && (
          <div className="rounded-xl border border-blue-500/30 bg-blue-950/30 p-4 text-xs text-blue-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-blue-400 shrink-0" />
              <span>
                You currently have no directly assigned deliverables. Displaying
                production deliverables across the studio for your review.
              </span>
            </div>
          </div>
        )}

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="My Assigned Tasks"
            value={displayVideos.length}
            icon={Film}
            description="Active video deliverables in your queue"
            colorScheme="blue"
          />

          <StatCard
            title="In Progress"
            value={myInProgress}
            icon={Clock}
            description="Currently in editing, audio, or VFX"
            colorScheme="amber"
          />

          <StatCard
            title="Pending Review / Revision"
            value={myPendingReview}
            icon={AlertCircle}
            description="Awaiting director approval or client feedback"
            colorScheme="rose"
          />

          <StatCard
            title="Completed / Delivered"
            value={myDelivered}
            icon={CheckCircle2}
            description={
              displayVideos.length > 0
                ? `${Math.round(
                    (myDelivered / displayVideos.length) * 100
                  )}% completion rate`
                : "No deliverables"
            }
            trend={
              displayVideos.length > 0
                ? `${Math.round((myDelivered / displayVideos.length) * 100)}%`
                : undefined
            }
            colorScheme="emerald"
          />
        </div>

        {/* Middle Section: My Assigned Projects + Deadlines This Week */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Assigned Projects (2 columns) */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-white">My Projects</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Production campaigns containing your assigned deliverables
                </p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 text-xs font-semibold text-purple-300">
                <FolderKanban className="h-3 w-3" />
                {myProjects.length} Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
              {myProjects.length > 0 ? (
                myProjects.slice(0, 4).map((project) => {
                  const projVideos = displayVideos.filter(
                    (v) => v.project_id === project.id
                  );
                  const deliveredInProj = projVideos.filter(
                    (v) => v.status === "delivered"
                  ).length;
                  const pct =
                    projVideos.length > 0
                      ? Math.round((deliveredInProj / projVideos.length) * 100)
                      : 0;

                  return (
                    <div
                      key={project.id}
                      className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-4 hover:border-slate-700 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[11px] font-semibold text-purple-400 truncate">
                            {project.client?.name || "Client Campaign"}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-500 px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800">
                            {project.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-white line-clamp-1 mb-1">
                          {project.name}
                        </h4>
                        {project.description && (
                          <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                            {project.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 mt-2">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-slate-400">
                            Deliverables: {deliveredInProj}/{projVideos.length}
                          </span>
                          <span className="font-semibold text-emerald-400">
                            {pct}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden mb-3">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-emerald-500 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <Link
                          href={`/projects/${project.id}`}
                          className="flex items-center justify-center gap-1.5 w-full rounded-lg bg-slate-900 hover:bg-purple-900/30 hover:text-purple-300 border border-slate-800 hover:border-purple-500/40 py-1.5 text-xs font-medium text-slate-300 transition-colors"
                        >
                          Open Kanban Board <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 text-center">
                  <FolderKanban className="h-8 w-8 text-slate-600 mb-2" />
                  <p className="text-sm font-medium text-slate-400">
                    No active projects found
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Deadlines This Week (1 column) */}
          <div className="lg:col-span-1 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-white">Deadlines This Week</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Upcoming deliverables due in 7 days
                </p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                <Calendar className="h-3 w-3" />
                {myUpcomingDeadlines.length}
              </span>
            </div>

            <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[320px]">
              {myUpcomingDeadlines.length > 0 ? (
                myUpcomingDeadlines.map((video) => (
                  <div
                    key={video.id}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="h-9 w-12 rounded-lg object-cover border border-slate-800 shrink-0"
                        />
                      ) : (
                        <div className="flex h-9 w-12 items-center justify-center rounded-lg bg-slate-800 text-slate-400 shrink-0">
                          <Film className="h-3.5 w-3.5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-xs font-medium text-slate-200 truncate">
                          {video.title}
                        </h4>
                        <p className="text-[11px] text-amber-400 font-medium">
                          Due {formatDate(video.due_date)}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/projects/${video.project_id}`}
                      className="rounded-lg p-1.5 text-slate-400 hover:text-white shrink-0"
                      title="Go to board"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ))
              ) : (
                <div className="flex h-44 flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400/80 mb-2" />
                  <p className="text-xs font-medium text-slate-300">
                    No deadlines this week
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Your scheduled deliverables are on track!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lower Section: My Tasks & Deliverables with Direct Status Update */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">
                My Deliverables & Tasks
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Update status directly or navigate to the project Kanban board
              </p>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {displayVideos.length} deliverables assigned
            </span>
          </div>

          <div className="space-y-3">
            {displayVideos.length > 0 ? (
              displayVideos.map((video) => {
                const statusInfo = getStatusBadgeInfo(video.status);
                const { isDueSoon: dueSoon, isOverdue } = isDueSoon(
                  video.due_date
                );
                const isUpdating = updatingVideoId === video.id;

                return (
                  <div
                    key={video.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 hover:border-slate-700/80 transition-all"
                  >
                    {/* Video Info */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="h-12 w-16 rounded-lg object-cover border border-slate-800 shrink-0"
                        />
                      ) : (
                        <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-slate-800 text-slate-400 shrink-0">
                          <Film className="h-5 w-5" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-white truncate">
                            {video.title}
                          </h4>
                          {video.status === "delivered" && (
                            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              <CheckCircle className="h-3 w-3" /> Done
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span>
                            Project:{" "}
                            <strong className="text-slate-300">
                              {video.project?.name || "Production Campaign"}
                            </strong>
                          </span>
                          {video.project?.client?.name && (
                            <>
                              <span>•</span>
                              <span className="text-purple-400">
                                {video.project.client.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Deadline, Status Dropdown, and Jump Link */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t border-slate-800 sm:border-0">
                      {/* Due Date Indicator */}
                      {video.due_date ? (
                        <div
                          className={cn(
                            "text-xs font-medium px-2 py-1 rounded-md border",
                            isOverdue && video.status !== "delivered"
                              ? "text-rose-400 bg-rose-500/10 border-rose-500/30 font-semibold"
                              : dueSoon && video.status !== "delivered"
                              ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
                              : "text-slate-400 bg-slate-900 border-slate-800"
                          )}
                        >
                          Due {formatDate(video.due_date)}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">
                          No deadline
                        </span>
                      )}

                      {/* Direct Status Selector */}
                      <div className="relative">
                        <select
                          value={video.status}
                          disabled={isUpdating}
                          onChange={(e) =>
                            handleStatusChange(
                              video,
                              e.target.value as VideoStatus
                            )
                          }
                          className={cn(
                            "text-xs font-semibold rounded-lg px-2.5 py-1.5 border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500",
                            video.status === "delivered"
                              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                              : video.status === "in_progress"
                              ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                              : video.status === "review"
                              ? "bg-purple-500/15 border-purple-500/40 text-purple-300"
                              : video.status === "revision"
                              ? "bg-rose-500/15 border-rose-500/40 text-rose-300"
                              : "bg-slate-900 border-slate-700 text-slate-300"
                          )}
                        >
                          <option value="not_started">Not Started</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="revision">Revision</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      </div>

                      {/* Jump to Project Kanban */}
                      <Link
                        href={`/projects/${video.project_id}`}
                        className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Open Kanban Board"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 text-center">
                <Film className="h-8 w-8 text-slate-600 mb-2" />
                <p className="text-sm font-medium text-slate-400">
                  No deliverables currently assigned
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // ADMIN VIEW (EXECUTIVE OVERVIEW)
  // ============================================================================
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Executive Overview
            </h1>
            <span className="rounded-full bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 text-xs font-semibold text-purple-300">
              Admin
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time pipeline monitoring, client delivery benchmarks, and deliverable health.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Link href="/clients">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> New Client / Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Loading Skeleton */}
      {adminLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-slate-900/60 animate-pulse border border-slate-800"
            />
          ))}
        </div>
      )}

      {/* 4 Stat Cards */}
      {adminData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Videos Tracked"
            value={adminData.totalVideos}
            icon={Film}
            description="Across all active client campaigns"
            colorScheme="blue"
          />

          <StatCard
            title="Videos Delivered"
            value={adminData.deliveredVideos}
            icon={CheckCircle2}
            description={
              adminData.totalVideos > 0
                ? `${Math.round(
                    (adminData.deliveredVideos / adminData.totalVideos) * 100
                  )}% overall completion rate`
                : "No videos recorded"
            }
            trend={
              adminData.totalVideos > 0
                ? `${Math.round(
                    (adminData.deliveredVideos / adminData.totalVideos) * 100
                  )}%`
                : undefined
            }
            colorScheme="emerald"
          />

          <StatCard
            title="In Progress"
            value={adminData.inProgressVideos}
            icon={Clock}
            description="Currently in editing & sound mix"
            colorScheme="amber"
          />

          <StatCard
            title="Needing Work"
            value={adminData.needingWorkVideos}
            icon={AlertCircle}
            description="Not started or revision requested"
            colorScheme="rose"
          />
        </div>
      )}

      {/* Middle Section: Recharts Status Breakdown + Videos Due This Week */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Breakdown Chart Card */}
        <div className="lg:col-span-1 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-white">Status Breakdown</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Distribution across kanban stages
              </p>
            </div>
            <TrendingUp className="h-4 w-4 text-purple-400" />
          </div>

          {adminData && <StatusPieChart data={adminData.statusBreakdown} />}
        </div>

        {/* Videos Due This Week */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-white">Deadlines This Week</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Upcoming video deliverable deadlines within next 7 days
              </p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 text-xs font-semibold text-purple-300">
              <Calendar className="h-3 w-3" />
              {adminData?.dueThisWeek.length || 0} Scheduled
            </span>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[280px]">
            {adminData?.dueThisWeek && adminData.dueThisWeek.length > 0 ? (
              adminData.dueThisWeek.map((video) => (
                <div
                  key={video.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="h-10 w-14 rounded-lg object-cover border border-slate-800"
                      />
                    ) : (
                      <div className="flex h-10 w-14 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
                        <Film className="h-4 w-4" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-medium text-slate-200">
                        {video.title}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Project: {video.project?.name || "Client Campaign"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold text-amber-400">
                      Due {formatDate(video.due_date)}
                    </span>
                    <Link
                      href={`/projects/${video.project_id}`}
                      className="rounded-lg p-1 text-slate-400 hover:text-white"
                      title="Go to project kanban"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-44 flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-400/80 mb-2" />
                <p className="text-sm font-medium text-slate-300">
                  All caught up for this week!
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  No deliverables currently scheduled in the next 7 days.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Per-Client Summary Cards */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-white">
              Client Portfolio Overview
            </h3>
            <p className="text-xs text-slate-400">
              Active accounts and overall delivery completion rates
            </p>
          </div>
          <Link
            href="/clients"
            className="text-xs font-medium text-purple-400 hover:text-purple-300 flex items-center gap-1"
          >
            Manage Clients &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {adminData?.clientSummaries.map((summary) => (
            <ClientSummaryCard
              key={summary.client.id}
              client={summary.client}
              totalVideos={summary.totalVideos}
              deliveredVideos={summary.deliveredVideos}
              progressPercentage={summary.progressPercentage}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
