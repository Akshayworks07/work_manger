"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, Clock, Trash2, GripVertical, CheckCircle } from "lucide-react";
import { Video } from "@/lib/types";
import { formatDate, isDueSoon, getStatusBadgeInfo, cn } from "@/lib/utils";

interface VideoCardProps {
  video: Video;
  onDelete?: (id: string) => void;
  isOverlay?: boolean;
}

export function VideoCard({ video, onDelete, isOverlay = false }: VideoCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: video.id,
    data: {
      type: "Video",
      video,
    },
    disabled: isOverlay,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const { isDueSoon: dueSoon, isOverdue } = isDueSoon(video.due_date);
  const statusInfo = getStatusBadgeInfo(video.status);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex flex-col rounded-xl border border-slate-800/80 bg-slate-900/90 p-3.5 shadow-sm transition-all hover:border-slate-700 hover:shadow-md",
        isDragging && "opacity-30 border-purple-500/50 scale-95",
        isOverlay && "rotate-2 scale-105 shadow-2xl border-purple-500 ring-2 ring-purple-500/30 cursor-grabbing bg-slate-900"
      )}
    >
      {/* Thumbnail or Video Header Preview */}
      {video.thumbnail_url && (
        <div className="relative mb-3 h-28 w-full overflow-hidden rounded-lg bg-slate-950 border border-slate-800">
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {video.status === "delivered" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                <CheckCircle className="h-3.5 w-3.5" /> Delivered
              </span>
            </div>
          )}
        </div>
      )}

      {/* Header with drag handle and title */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-slate-100 leading-snug group-hover:text-purple-200 transition-colors">
          {video.title}
        </h4>
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 p-1 -mr-1 -mt-1 rounded transition-colors"
          title="Drag video"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      </div>

      {/* Status indicator tag */}
      <div className="mt-2.5 flex items-center gap-1.5">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium border",
            statusInfo.badgeClass
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", statusInfo.dotColor)} />
          {statusInfo.label}
        </span>
      </div>

      {/* Footer: Due date, assignee, delete button */}
      <div className="mt-3.5 flex items-center justify-between pt-2.5 border-t border-slate-800/80 text-xs">
        {video.due_date ? (
          <div
            className={cn(
              "flex items-center gap-1 text-[11px] font-medium",
              isOverdue && video.status !== "delivered"
                ? "text-rose-400 font-semibold"
                : dueSoon && video.status !== "delivered"
                ? "text-amber-400"
                : "text-slate-400"
            )}
            title={
              isOverdue && video.status !== "delivered"
                ? "Overdue!"
                : dueSoon && video.status !== "delivered"
                ? "Due in next 3 days"
                : "Due Date"
            }
          >
            {isOverdue && video.status !== "delivered" ? (
              <Clock className="h-3 w-3" />
            ) : (
              <Calendar className="h-3 w-3" />
            )}
            <span>{formatDate(video.due_date)}</span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-500">No deadline</span>
        )}

        <div className="flex items-center gap-1.5">
          {onDelete && !isOverlay && (
            <button
              onClick={() => onDelete(video.id)}
              className="opacity-0 group-hover:opacity-100 rounded p-1 text-slate-500 hover:bg-rose-500/20 hover:text-rose-400 transition-all"
              title="Delete deliverable"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Assignee Avatar */}
          {video.assignee ? (
            <div
              className="h-5 w-5 rounded-full overflow-hidden border border-purple-500/40"
              title={`Assigned to ${video.assignee.full_name || video.assignee.email}`}
            >
              {video.assignee.avatar_url ? (
                <img
                  src={video.assignee.avatar_url}
                  alt={video.assignee.full_name || ""}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-purple-700 text-[9px] font-bold text-white">
                  {(video.assignee.full_name || video.assignee.email).charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          ) : (
            <div className="h-5 w-5 rounded-full border border-dashed border-slate-700 flex items-center justify-center text-[9px] text-slate-500" title="Unassigned">
              —
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
