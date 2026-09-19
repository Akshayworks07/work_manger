"use client";

import { useRef, useState, useTransition } from "react";
import { createTeamMember } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

const ROLES = [
  { value: "manager", label: "Manager" },
  { value: "team_member", label: "Team Member" },
  { value: "client", label: "Client" },
  { value: "admin", label: "Admin" },
];

const inputClass =
  "h-10 rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-400";

export function AddMemberForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await createTeamMember(formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        setSuccess(true);
        formRef.current?.reset();
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-700">Full name</label>
          <input name="fullName" required className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-700">Role</label>
          <select name="role" required className={inputClass} defaultValue="team_member">
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-700">Username (for login)</label>
          <input name="username" required pattern="[a-z0-9_]{3,20}" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-700">Job title (optional)</label>
          <input name="jobTitle" className={inputClass} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-700">Email (used only for account recovery)</label>
        <input name="email" type="email" required className={inputClass} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-700">Temporary password</label>
        <input name="password" type="password" required minLength={8} className={inputClass} />
        <p className="text-xs text-neutral-400">
          At least 8 characters, with an uppercase letter, a lowercase letter, and a number.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          Account created. Share the username and temporary password with them directly.
        </p>
      )}

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "Creating..." : "Create account"}
      </Button>
    </form>
  );
}
