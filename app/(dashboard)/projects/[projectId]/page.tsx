"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  FolderKanban,
  Building2,
  Film,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { fetchProjectDetails } from "@/lib/data-store";
import { useApp } from "@/lib/providers";
import { Board } from "@/components/kanban/Board";
import { Button } from "@/components/ui/button";

export default function ProjectKanbanPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["project-kanban", projectId],
    queryFn: () => fetchProjectDetails(projectId),
  });

  const project = data?.project;
  const columns = data?.columns || [];
  const videos = data?.videos || [];

  const { profile } = useApp();
  const isAdmin = profile?.role === "admin";

  const deliveredCount = videos.filter((v) => v.status === "delivered").length;
  const inProgressCount = videos.filter((v) => v.status === "in_progress").length;
  const percentage =
    videos.length > 0 ? Math.round((deliveredCount / videos.length) * 100) : 0;

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-[1700px] mx-auto">
      {/* Top Breadcrumb & Status Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {isAdmin ? (
              <Link
                href="/clients"
                className="hover:text-white transition-colors"
              >
                Clients
              </Link>
            ) : (
              <Link
                href="/"
                className="hover:text-white transition-colors"
              >
                Dashboard
              </Link>
            )}
            <span>/</span>
            {project?.client ? (
              isAdmin ? (
                <Link
                  href={`/clients/${project.client.id}`}
                  className="hover:text-white transition-colors text-purple-400"
                >
                  {project.client.name}
                </Link>
              ) : (
                <span className="text-purple-400 font-medium">
                  {project.client.name}
                </span>
              )
            ) : (
              <span>Client</span>
            )}
            <span>/</span>
            <span className="text-slate-200 font-medium">{project?.name || "Project"}</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {project?.name || "Project Kanban Board"}
            </h1>
            {project?.status && (
              <span className="rounded-md bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 text-xs font-semibold text-purple-300 capitalize">
                {project.status.replace("_", " ")}
              </span>
            )}
          </div>

          {project?.description && (
            <p className="text-xs text-slate-400 max-w-3xl line-clamp-1">
              {project.description}
            </p>
          )}
        </div>

        {/* Deliverable Metrics Pill */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Film className="h-4 w-4 text-purple-400" />
              <span>
                <strong>{videos.length}</strong> Total
              </span>
            </div>
            <div className="h-3 w-px bg-slate-800" />
            <div className="flex items-center gap-1.5 text-amber-300">
              <Clock className="h-4 w-4 text-amber-400" />
              <span>
                <strong>{inProgressCount}</strong> Active
              </span>
            </div>
            <div className="h-3 w-px bg-slate-800" />
            <div className="flex items-center gap-1.5 text-emerald-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>
                <strong>{deliveredCount}</strong> Delivered ({percentage}%)
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-9 w-9 p-0"
            title="Refresh board"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="flex h-96 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          </div>
        ) : (
          <Board
            projectId={projectId}
            columns={columns}
            initialVideos={videos}
            onDataChange={() => {
              queryClient.invalidateQueries({
                queryKey: ["project-kanban", projectId],
              });
              queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
              queryClient.invalidateQueries({ queryKey: ["all-videos"] });
            }}
          />
        )}
      </div>
    </div>
  );
}
