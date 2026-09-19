"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProject, createClientRecord } from "@/lib/actions/projects";
import { PROJECT_TYPES, PRIORITY_LABELS } from "@/lib/constants/projects";
import { Button } from "@/components/ui/button";

const inputClass =
  "h-10 rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-400 w-full";
const labelClass = "text-sm font-medium text-neutral-700";

interface Option {
  id: string;
  label: string;
}

export function ProjectForm({
  clients: initialClients,
  managers,
  teamMembers,
}: {
  clients: Option[];
  managers: Option[];
  teamMembers: Option[];
}) {
  const router = useRouter();
  const [clients, setClients] = useState(initialClients);
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isAddingClient, startAddingClient] = useTransition();

  function handleAddClient() {
    if (!newClientName.trim()) {
      setClientError("Enter a client name first.");
      return;
    }
    setClientError(null);
    const fd = new FormData();
    fd.set("clientName", newClientName.trim());
    startAddingClient(async () => {
      const result = await createClientRecord(fd);
      if ("error" in result) {
        setClientError(result.error);
        return;
      }
      const newClient = { id: result.id!, label: newClientName.trim() };
      setClients((c) => [...c, newClient]);
      setSelectedClientId(newClient.id);
      setShowNewClient(false);
      setNewClientName("");
    });
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createProject(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.push(`/projects/${result.id}`);
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Project name</label>
        <input name="name" required className={inputClass} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Client</label>
        {!showNewClient ? (
          <div className="flex gap-2">
            <select
              name="clientId"
              required
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className={inputClass}
            >
              <option value="">Select a client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowNewClient(true)}>
              New client
            </Button>
          </div>
        ) : (
          <div className="flex gap-2 items-start">
            <div className="flex-1">
              <input
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="New client name"
                className={inputClass}
              />
              {clientError && <p className="text-xs text-red-600 mt-1">{clientError}</p>}
            </div>
            <Button type="button" size="sm" disabled={isAddingClient} onClick={handleAddClient}>
              {isAddingClient ? "Adding..." : "Add"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowNewClient(false)}>
              Cancel
            </Button>
          </div>
        )}
        {/* Hidden input keeps clientId submitted even while the "new client" mini-form is open */}
        {showNewClient && <input type="hidden" name="clientId" value={selectedClientId} />}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Project type</label>
          <select name="projectType" required defaultValue="" className={inputClass}>
            <option value="" disabled>Select a type...</option>
            {PROJECT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Priority</label>
          <select name="priority" required defaultValue="medium" className={inputClass}>
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Start date</label>
          <input name="startDate" type="date" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Deadline</label>
          <input name="deadline" type="date" className={inputClass} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Manager</label>
        <select name="managerId" className={inputClass} defaultValue="">
          <option value="">Unassigned</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Assigned team members</label>
        <div className="flex flex-col gap-1.5 border border-neutral-200 rounded-lg p-3 max-h-40 overflow-y-auto">
          {teamMembers.length === 0 && (
            <p className="text-xs text-neutral-400">No team members yet — add them from the Team page.</p>
          )}
          {teamMembers.map((tm) => (
            <label key={tm.id} className="flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" name="teamMembers" value={tm.id} className="rounded" />
              {tm.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Description</label>
        <textarea name="description" rows={3} className={inputClass + " h-auto"} />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      )}

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "Creating..." : "Create project"}
      </Button>
    </form>
  );
}
