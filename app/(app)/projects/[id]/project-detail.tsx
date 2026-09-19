"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateProject,
  archiveProject,
  unarchiveProject,
  addProjectMember,
  removeProjectMember,
  grantClientAccess,
  revokeClientAccess,
} from "@/lib/actions/projects";
import { PROJECT_TYPES, PRIORITY_LABELS, STATUS_LABELS } from "@/lib/constants/projects";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, PriorityBadge } from "@/components/badges";

const inputClass =
  "h-9 rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-400 w-full";
const labelClass = "text-xs font-medium text-neutral-500";

interface Option { id: string; label: string; }
interface Project {
  id: string;
  name: string;
  description: string | null;
  project_type: string | null;
  priority: string;
  status: string;
  start_date: string | null;
  deadline: string | null;
  manager_id: string | null;
  is_archived: boolean;
  client_name: string;
}

export function ProjectDetail({
  project,
  canManage,
  isClientView,
  managers,
  currentMembers,
  availableTeamMembers,
  currentClientAccess,
  availableClients,
}: {
  project: Project;
  canManage: boolean;
  isClientView: boolean;
  managers: Option[];
  currentMembers: Option[];
  availableTeamMembers: Option[];
  currentClientAccess: Option[];
  availableClients: Option[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isArchiving, startArchiving] = useTransition();
  const [confirmArchive, setConfirmArchive] = useState(false);

  function handleSave(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateProject(project.id, formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  function handleArchiveToggle() {
    startArchiving(async () => {
      if (project.is_archived) {
        await unarchiveProject(project.id);
      } else {
        await archiveProject(project.id);
      }
      setConfirmArchive(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">{project.name}</h1>
          <p className="text-sm text-neutral-400">{project.client_name}</p>
        </div>
        <div className="flex gap-2 items-center shrink-0">
          <StatusBadge status={project.status} />
          <PriorityBadge priority={project.priority} />
        </div>
      </div>

      {project.is_archived && (
        <div className="bg-neutral-100 border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-600">
          This project is archived and hidden from the main list.
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Details</CardTitle>
          {canManage && !editing && (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button>
          )}
        </CardHeader>
        <CardContent>
          {!editing ? (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className={labelClass}>Type</p>
                <p className="text-neutral-800">{project.project_type ?? "—"}</p>
              </div>
              <div>
                <p className={labelClass}>Manager</p>
                <p className="text-neutral-800">
                  {managers.find((m) => m.id === project.manager_id)?.label ?? "Unassigned"}
                </p>
              </div>
              <div>
                <p className={labelClass}>Start date</p>
                <p className="text-neutral-800">{project.start_date ? new Date(project.start_date).toLocaleDateString() : "—"}</p>
              </div>
              <div>
                <p className={labelClass}>Deadline</p>
                <p className="text-neutral-800">{project.deadline ? new Date(project.deadline).toLocaleDateString() : "—"}</p>
              </div>
              <div className="col-span-2">
                <p className={labelClass}>Description</p>
                <p className="text-neutral-800 whitespace-pre-wrap">{project.description || "No description."}</p>
              </div>
            </div>
          ) : (
            <form action={handleSave} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Name</label>
                <input name="name" defaultValue={project.name} required className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Type</label>
                  <select name="projectType" defaultValue={project.project_type ?? ""} className={inputClass}>
                    {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Status</label>
                  <select name="status" defaultValue={project.status} className={inputClass}>
                    {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Priority</label>
                  <select name="priority" defaultValue={project.priority} className={inputClass}>
                    {Object.entries(PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Manager</label>
                  <select name="managerId" defaultValue={project.manager_id ?? ""} className={inputClass}>
                    <option value="">Unassigned</option>
                    {managers.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Start date</label>
                  <input name="startDate" type="date" defaultValue={project.start_date ?? ""} className={inputClass} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Deadline</label>
                  <input name="deadline" type="date" defaultValue={project.deadline ?? ""} className={inputClass} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Description</label>
                <textarea name="description" rows={3} defaultValue={project.description ?? ""} className={inputClass + " h-auto"} />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={isPending}>{isPending ? "Saving..." : "Save changes"}</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {!isClientView && (
        <Card>
          <CardHeader><CardTitle>Team on this project</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2">
            {currentMembers.length === 0 && <p className="text-sm text-neutral-400">No team members assigned yet.</p>}
            {currentMembers.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-sm border-b border-neutral-100 py-2 last:border-0">
                <span className="text-neutral-800">{m.label}</span>
                {canManage && (
                  <button
                    className="text-xs text-red-600 hover:underline"
                    onClick={() => startTransition(async () => { await removeProjectMember(project.id, m.id); router.refresh(); })}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            {canManage && availableTeamMembers.length > 0 && (
              <form
                action={(fd) => {
                  const id = String(fd.get("memberId"));
                  if (id) startTransition(async () => { await addProjectMember(project.id, id); router.refresh(); });
                }}
                className="flex gap-2 pt-2"
              >
                <select name="memberId" className={inputClass} defaultValue="">
                  <option value="" disabled>Add a team member...</option>
                  {availableTeamMembers.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
                <Button type="submit" size="sm" variant="outline">Add</Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {canManage && (
        <>
          <Card>
            <CardHeader><CardTitle>Shared with clients</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-2">
              {currentClientAccess.length === 0 && <p className="text-sm text-neutral-400">Not shared with any client accounts yet.</p>}
              {currentClientAccess.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm border-b border-neutral-100 py-2 last:border-0">
                  <span className="text-neutral-800">{c.label}</span>
                  <button
                    className="text-xs text-red-600 hover:underline"
                    onClick={() => startTransition(async () => { await revokeClientAccess(project.id, c.id); router.refresh(); })}
                  >
                    Revoke
                  </button>
                </div>
              ))}
              {availableClients.length > 0 && (
                <form
                  action={(fd) => {
                    const id = String(fd.get("clientProfileId"));
                    if (id) startTransition(async () => { await grantClientAccess(project.id, id); router.refresh(); });
                  }}
                  className="flex gap-2 pt-2"
                >
                  <select name="clientProfileId" className={inputClass} defaultValue="">
                    <option value="" disabled>Share with a client account...</option>
                    {availableClients.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                  <Button type="submit" size="sm" variant="outline">Share</Button>
                </form>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Danger zone</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-2">
              <p className="text-sm text-neutral-500">
                {project.is_archived
                  ? "This project is archived. Restore it to make it active again."
                  : "Archiving hides this project from the main list without deleting any of its history."}
              </p>
              {!confirmArchive ? (
                <Button
                  size="sm"
                  variant={project.is_archived ? "outline" : "destructive"}
                  className="w-fit"
                  onClick={() => (project.is_archived ? handleArchiveToggle() : setConfirmArchive(true))}
                >
                  {project.is_archived ? "Restore project" : "Archive project"}
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-neutral-700">Are you sure? This can be undone later.</p>
                  <Button size="sm" variant="destructive" disabled={isArchiving} onClick={handleArchiveToggle}>
                    {isArchiving ? "Archiving..." : "Yes, archive"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmArchive(false)}>Cancel</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
