"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ArrowLeft,
  Plus,
  FolderKanban,
  ArrowRight,
  Mail,
  Film,
  CheckCircle2,
  Clock,
  Calendar,
} from "lucide-react";
import { fetchClients, fetchProjects, fetchAllVideos, createProjectRecord } from "@/lib/data-store";
import { Project, ProjectStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";

const projectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters"),
  description: z.string().optional(),
  status: z.enum(["active", "completed", "on_hold"]),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.clientId as string;
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });
  const client = clients.find((c) => c.id === clientId);

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["projects", clientId],
    queryFn: () => fetchProjects(clientId),
  });

  const { data: allVideos = [] } = useQuery({
    queryKey: ["all-videos"],
    queryFn: fetchAllVideos,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "active",
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: ProjectFormValues) =>
      createProjectRecord({
        client_id: clientId,
        name: values.name,
        description: values.description || null,
        status: values.status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", clientId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setIsCreateOpen(false);
      reset();
    },
  });

  const onSubmit = (values: ProjectFormValues) => {
    createMutation.mutate(values);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-3">
        <Link
          href="/clients"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Clients
        </Link>
      </div>

      {/* Client Profile Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/80 to-purple-950/30 p-6 sm:p-8 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {client?.logo_url ? (
              <img
                src={client.logo_url}
                alt={client.name}
                className="h-16 w-16 rounded-2xl object-cover border border-slate-700 shadow-xl"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-600/30 border border-purple-500/40 text-xl font-bold text-purple-300">
                {(client?.name || "CL").substring(0, 2).toUpperCase()}
              </div>
            )}

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {client?.name || "Client Details"}
                </h1>
                <span className="rounded-full bg-purple-500/15 border border-purple-500/30 px-3 py-0.5 text-xs font-semibold text-purple-300">
                  Client Account
                </span>
              </div>
              {client?.contact_email && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                  <Mail className="h-3.5 w-3.5 text-slate-500" />
                  <span>{client.contact_email}</span>
                </div>
              )}
            </div>
          </div>

          <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" /> New Production Project
          </Button>
        </div>
      </div>

      {/* Projects List */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-white">Video Projects</h2>
            <p className="text-xs text-slate-400">
              Active bodies of work and kanban boards for this client
            </p>
          </div>
          <span className="text-xs text-slate-500">
            {projects.length} Project{projects.length !== 1 ? "s" : ""}
          </span>
        </div>

        {projectsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-48 rounded-2xl bg-slate-900/60 animate-pulse border border-slate-800"
              />
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project) => {
              const projectVideos = allVideos.filter(
                (v) => v.project_id === project.id
              );
              const total = projectVideos.length;
              const delivered = projectVideos.filter(
                (v) => v.status === "delivered"
              ).length;
              const percentage =
                total > 0 ? Math.round((delivered / total) * 100) : 0;

              return (
                <div
                  key={project.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-sm transition-all hover:border-purple-500/40 hover:bg-slate-900/90"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 mb-2">
                          {project.status.replace("_", " ")}
                        </span>
                        <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
                          {project.name}
                        </h3>
                      </div>
                      <div className="rounded-xl p-2.5 bg-slate-800/60 text-slate-400 group-hover:text-purple-400 transition-colors">
                        <FolderKanban className="h-5 w-5" />
                      </div>
                    </div>

                    {project.description && (
                      <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                    )}

                    {/* Progress indicator */}
                    <div className="mt-6 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <Film className="h-3.5 w-3.5 text-slate-500" />
                          Deliverables Progress
                        </span>
                        <span className="font-semibold text-white">
                          {delivered} / {total} delivered ({percentage}%)
                        </span>
                      </div>
                      <Progress value={percentage} />
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800/60 text-xs">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Calendar className="h-3 w-3" /> Created {formatDate(project.created_at)}
                    </span>

                    <Link href={`/projects/${project.id}`}>
                      <Button size="sm" className="gap-2">
                        <span>Open Kanban Board</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 p-12 text-center">
            <FolderKanban className="h-10 w-10 text-slate-600 mb-3" />
            <h3 className="text-base font-semibold text-slate-300">
              No projects created yet
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Create a video production project to organize and track deliverables with a kanban board.
            </p>
            <Button
              onClick={() => setIsCreateOpen(true)}
              size="sm"
              className="mt-4 gap-2"
            >
              <Plus className="h-4 w-4" /> Create Project
            </Button>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent onClose={() => setIsCreateOpen(false)}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Create Video Project</DialogTitle>
              <p className="text-xs text-slate-400 mt-1">
                A project represents a campaign or delivery cycle for this client.
              </p>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="proj-name">Project Title *</Label>
                <Input
                  id="proj-name"
                  placeholder="e.g. Q1 Global Social Campaign"
                  {...register("name")}
                  className="mt-1.5"
                />
                {errors.name && (
                  <p className="text-xs text-rose-400 mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="proj-desc">Scope & Description</Label>
                <Textarea
                  id="proj-desc"
                  placeholder="Details on deliverables, formats, video cuts, and milestones..."
                  {...register("description")}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="proj-status">Status</Label>
                <select
                  id="proj-status"
                  {...register("status")}
                  className="mt-1.5 flex h-9 w-full rounded-lg border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-sm text-slate-100 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On Hold</option>
                </select>
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
                Create Project
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
