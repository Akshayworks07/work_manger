"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
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
} from "lucide-react";
import { getDashboardStats } from "@/lib/data-store";
import { StatCard } from "@/components/dashboard/StatCard";
import { ClientSummaryCard } from "@/components/dashboard/ClientSummaryCard";
import { StatusPieChart } from "@/components/charts/StatusPieChart";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export default function OverviewDashboardPage() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Executive Overview
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time pipeline monitoring, client delivery benchmarks, and deliverable health.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
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
      {isLoading && (
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
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Videos Tracked"
            value={data.totalVideos}
            icon={Film}
            description="Across all active client campaigns"
            colorScheme="blue"
          />

          <StatCard
            title="Videos Delivered"
            value={data.deliveredVideos}
            icon={CheckCircle2}
            description={
              data.totalVideos > 0
                ? `${Math.round((data.deliveredVideos / data.totalVideos) * 100)}% overall completion rate`
                : "No videos recorded"
            }
            trend={
              data.totalVideos > 0
                ? `${Math.round((data.deliveredVideos / data.totalVideos) * 100)}%`
                : undefined
            }
            colorScheme="emerald"
          />

          <StatCard
            title="In Progress"
            value={data.inProgressVideos}
            icon={Clock}
            description="Currently in editing & sound mix"
            colorScheme="amber"
          />

          <StatCard
            title="Needing Work"
            value={data.needingWorkVideos}
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

          {data && <StatusPieChart data={data.statusBreakdown} />}
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
              {data?.dueThisWeek.length || 0} Scheduled
            </span>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[280px]">
            {data?.dueThisWeek && data.dueThisWeek.length > 0 ? (
              data.dueThisWeek.map((video) => (
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
            <h3 className="text-lg font-bold text-white">Client Portfolio Overview</h3>
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
          {data?.clientSummaries.map((summary) => (
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
