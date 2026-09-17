"use client";

import React, { useState, useTransition } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import confetti from "canvas-confetti";
import { Plus, Sparkles } from "lucide-react";
import { KanbanColumn, Video, VideoStatus } from "@/lib/types";
import { Column } from "./Column";
import { VideoCard } from "./VideoCard";
import { updateVideoStatus, createVideoRecord, deleteVideoRecord } from "@/lib/data-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BoardProps {
  projectId: string;
  columns: KanbanColumn[];
  initialVideos: Video[];
  onDataChange?: () => void;
}

const STATUS_KEYS: VideoStatus[] = [
  "not_started",
  "in_progress",
  "review",
  "revision",
  "delivered",
];

const COLUMN_STATUS_MAP: Record<string, VideoStatus> = {
  "Not Started": "not_started",
  "In Progress": "in_progress",
  Review: "review",
  Revision: "revision",
  Delivered: "delivered",
};

export function Board({
  projectId,
  columns,
  initialVideos,
  onDataChange,
}: BoardProps) {
  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [isPending, startTransition] = useTransition();

  // Create Video Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<VideoStatus>("not_started");
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newThumbnailUrl, setNewThumbnailUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Setup sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required to initiate drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const found = videos.find((v) => v.id === active.id);
    if (found) setActiveVideo(found);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveVideo(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const currentVideo = videos.find((v) => v.id === activeId);
    if (!currentVideo) return;

    // Determine target status
    let newStatus: VideoStatus = currentVideo.status;
    let targetIndex = 0;

    // If dropped directly onto a column container
    if (STATUS_KEYS.includes(overId as VideoStatus)) {
      newStatus = overId as VideoStatus;
    } else {
      // Dropped onto another video card
      const overVideo = videos.find((v) => v.id === overId);
      if (overVideo) {
        newStatus = overVideo.status;
      }
    }

    // Check if status changed
    const statusChanged = currentVideo.status !== newStatus;

    // Trigger celebration confetti if moved to delivered!
    if (statusChanged && newStatus === "delivered") {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#8b5cf6"],
        });
      } catch (e) {
        // Safe if canvas unavailable
      }
    }

    // Optimistically update videos in local state
    setVideos((prev) => {
      const oldIndex = prev.findIndex((v) => v.id === activeId);
      let updated = [...prev];

      if (statusChanged) {
        updated[oldIndex] = {
          ...updated[oldIndex],
          status: newStatus,
          delivered_at: newStatus === "delivered" ? new Date().toISOString() : updated[oldIndex].delivered_at,
        };
      }

      // Reorder if dropped over another item
      if (!STATUS_KEYS.includes(overId as VideoStatus)) {
        const newIndex = prev.findIndex((v) => v.id === overId);
        if (newIndex !== -1 && oldIndex !== newIndex) {
          updated = arrayMove(updated, oldIndex, newIndex);
        }
      }

      return updated;
    });

    // Asynchronously persist to Supabase
    startTransition(async () => {
      try {
        await updateVideoStatus(activeId, newStatus, targetIndex);
        if (onDataChange) onDataChange();
      } catch (err) {
        console.error("Failed to update video status in Supabase:", err);
      }
    });
  };

  const handleOpenAddModal = (status: VideoStatus) => {
    setTargetStatus(status);
    setNewTitle("");
    setNewDueDate("");
    setNewThumbnailUrl("");
    setIsCreateOpen(true);
  };

  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await createVideoRecord({
        project_id: projectId,
        title: newTitle.trim(),
        status: targetStatus,
        due_date: newDueDate || null,
        thumbnail_url: newThumbnailUrl.trim() || null,
      });

      setVideos((prev) => [created, ...prev]);
      setIsCreateOpen(false);
      if (onDataChange) onDataChange();
    } catch (err) {
      console.error("Failed to create video:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm("Are you sure you want to delete this deliverable?")) return;
    setVideos((prev) => prev.filter((v) => v.id !== videoId));
    try {
      await deleteVideoRecord(videoId);
      if (onDataChange) onDataChange();
    } catch (err) {
      console.error("Failed to delete video:", err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Action Bar */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Kanban Board
          </span>
          <span className="text-xs text-slate-500">•</span>
          <span className="text-xs text-slate-400">
            {videos.length} Total Deliverables
          </span>
        </div>

        <Button
          size="sm"
          onClick={() => handleOpenAddModal("not_started")}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" /> Add Video
        </Button>
      </div>

      {/* Dnd Board Columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 gap-4 overflow-x-auto pb-4 pt-1 items-start">
          {columns.map((col, idx) => {
            const statusKey =
              COLUMN_STATUS_MAP[col.name] ||
              STATUS_KEYS[idx] ||
              ("not_started" as VideoStatus);
            const columnVideos = videos.filter((v) => v.status === statusKey);

            return (
              <Column
                key={col.id || statusKey}
                column={col}
                statusKey={statusKey}
                videos={columnVideos}
                onAddVideo={handleOpenAddModal}
                onDeleteVideo={handleDeleteVideo}
              />
            );
          })}
        </div>

        {/* Drag Overlay for active card */}
        <DragOverlay dropAnimation={null}>
          {activeVideo ? (
            <VideoCard video={activeVideo} isOverlay={true} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Create Video Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent onClose={() => setIsCreateOpen(false)}>
          <form onSubmit={handleCreateVideo}>
            <DialogHeader>
              <DialogTitle>Add New Deliverable</DialogTitle>
              <p className="text-xs text-slate-400 mt-1">
                Create a video deliverable card for this production project.
              </p>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="video-title">Video Title *</Label>
                <Input
                  id="video-title"
                  placeholder="e.g. 60s Main Brand Film Cutdown"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="video-status">Initial Status</Label>
                  <select
                    id="video-status"
                    value={targetStatus}
                    onChange={(e) =>
                      setTargetStatus(e.target.value as VideoStatus)
                    }
                    className="mt-1.5 flex h-9 w-full rounded-lg border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-sm text-slate-100 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="revision">Revision</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="video-due">Due Date</Label>
                  <Input
                    id="video-due"
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="video-thumb">Thumbnail Image URL (Optional)</Label>
                <Input
                  id="video-thumb"
                  placeholder="https://... (or Unsplash image link)"
                  value={newThumbnailUrl}
                  onChange={(e) => setNewThumbnailUrl(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Create Deliverable
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
