"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { renameProject, archiveProject, deleteProject } from "@/actions/projects";

const COLOURS = ["#64748b", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#ec4899"];

export function ProjectSettings({
  project,
}: {
  project: { id: string; name: string; colour: string | null; status: string; isInbox: boolean };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function run(fn: (fd: FormData) => Promise<unknown>, fd: FormData) {
    startTransition(async () => {
      await fn(fd);
      router.refresh();
    });
  }

  if (project.isInbox) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-xl border border-line bg-surface px-3 py-1.5 text-sm text-muted transition hover:bg-ink/5"
      >
        Manage
      </button>
      {open && (
        <div className="card absolute right-0 z-20 mt-2 w-64 p-3 shadow-lg">
          <form
            action={(fd) => {
              fd.set("id", project.id);
              run(renameProject, fd);
            }}
            className="space-y-2"
          >
            <input name="name" defaultValue={project.name} required className="field w-full" />
            <div className="flex flex-wrap gap-1.5">
              {COLOURS.map((c) => (
                <label key={c} className="cursor-pointer">
                  <input type="radio" name="colour" value={c} defaultChecked={project.colour === c} className="peer sr-only" />
                  <span
                    className="block h-6 w-6 rounded-full ring-offset-2 ring-offset-surface peer-checked:ring-2 peer-checked:ring-ink"
                    style={{ background: c }}
                  />
                </label>
              ))}
            </div>
            <button type="submit" disabled={pending} className="btn-primary w-full py-1.5">
              Save
            </button>
          </form>

          <div className="mt-2 space-y-1 border-t border-line pt-2">
            <button
              onClick={() => {
                const fd = new FormData();
                fd.set("id", project.id);
                run(archiveProject, fd);
                setOpen(false);
              }}
              className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-muted transition hover:bg-ink/5"
            >
              {project.status === "ARCHIVED" ? "Unarchive project" : "Archive project"}
            </button>
            <button
              onClick={() => {
                if (!confirm(`Delete “${project.name}” and all its tasks? This cannot be undone.`)) return;
                const fd = new FormData();
                fd.set("id", project.id);
                run(deleteProject, fd);
              }}
              className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
            >
              Delete project
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
