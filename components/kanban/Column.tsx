"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { KanbanColumn, Video, VideoStatus } from "@/lib/types";
import { VideoCard } from "./VideoCard";
import { cn } from "@/lib/utils";

interface ColumnProps {
  column: KanbanColumn;
  statusKey: VideoStatus;
  videos: Video[];
  onAddVideo?: (status: VideoStatus) => void;
  onDeleteVideo?: (id: string) => void;
}

export function Column({
  column,
  statusKey,
  videos,
  onAddVideo,
  onDeleteVideo,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: statusKey,
    data: {
      type: "Column",
      statusKey,
      column,
    },
  });

  const columnHeaders: Record<
    VideoStatus,
    { dot: string; border: string; bg: string }
  > = {
    not_started: {
      dot: "bg-slate-400",
      border: "border-slate-800",
      bg: "bg-slate-900/40",
    },
    in_progress: {
      dot: "bg-amber-400 animate-pulse",
      border: "border-amber-500/20",
      bg: "bg-amber-950/10",
    },
    review: {
      dot: "bg-purple-400",
      border: "border-purple-500/20",
      bg: "bg-purple-950/10",
    },
    revision: {
      dot: "bg-rose-400",
      border: "border-rose-500/20",
      bg: "bg-rose-950/10",
    },
    delivered: {
      dot: "bg-emerald-400",
      border: "border-emerald-500/20",
      bg: "bg-emerald-950/10",
    },
  };

  const headerStyle = columnHeaders[statusKey] || columnHeaders.not_started;
  const videoIds = videos.map((v) => v.id);

  return (
    <div
      className={cn(
        "flex h-full w-72 min-w-[18rem] max-w-[18rem] flex-col rounded-2xl border bg-slate-900/50 backdrop-blur-sm transition-all duration-200",
        headerStyle.border,
        isOver && "ring-2 ring-purple-500/50 bg-slate-800/40 border-purple-500/50"
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <span className={cn("h-2.5 w-2.5 rounded-full", headerStyle.dot)} />
          <h3 className="text-sm font-semibold text-white tracking-wide">
            {column.name}
          </h3>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[11px] font-bold text-slate-300">
            {videos.length}
          </span>
        </div>

        {onAddVideo && (
          <button
            onClick={() => onAddVideo(statusKey)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title={`Add video to ${column.name}`}
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Videos List Container */}
      <div
        ref={setNodeRef}
        className="flex flex-1 flex-col gap-3 p-3 overflow-y-auto min-h-[300px]"
      >
        <SortableContext
          items={videoIds}
          strategy={verticalListSortingStrategy}
        >
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onDelete={onDeleteVideo}
            />
          ))}
        </SortableContext>

        {videos.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-800/80 p-6 text-center">
            <p className="text-xs text-slate-500">No deliverables</p>
            {onAddVideo && (
              <button
                onClick={() => onAddVideo(statusKey)}
                className="mt-2 text-xs font-medium text-purple-400 hover:text-purple-300"
              >
                + Add first video
              </button>
            )}
          </div>
        )}
      </div>

      {/* Column Footer Quick Add */}
      {onAddVideo && (
        <div className="p-2 border-t border-slate-800/40">
          <button
            onClick={() => onAddVideo(statusKey)}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-medium text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Deliverable
          </button>
        </div>
      )}
    </div>
  );
}
