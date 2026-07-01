"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLabel, renameLabel, deleteLabel } from "@/actions/labels";

const COLOURS = ["#c15f3c", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ec4899", "#14b8a6", "#64748b"];

type LabelRow = { id: string; name: string; colour: string | null; count: number };

export function LabelsManager({ labels }: { labels: LabelRow[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink">New label</h2>
        <form
          action={(fd) => {
            setError(null);
            startTransition(async () => {
              const res = await createLabel(fd);
              if (res?.error) setError(res.error);
              else router.refresh();
            });
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <input name="name" placeholder="Label name" required className="field flex-1" />
          <div className="flex gap-1.5">
            {COLOURS.map((c, i) => (
              <label key={c} className="cursor-pointer">
                <input type="radio" name="colour" value={c} defaultChecked={i === 0} className="peer sr-only" />
                <span
                  className="block h-6 w-6 rounded-full ring-offset-2 ring-offset-surface peer-checked:ring-2 peer-checked:ring-ink"
                  style={{ background: c }}
                />
              </label>
            ))}
          </div>
          <button type="submit" className="btn-primary px-4 py-1.5">Create</button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="card divide-y divide-line">
        {labels.length === 0 && <p className="px-4 py-8 text-center text-sm text-faint">No labels yet.</p>}
        {labels.map((l) =>
          editing === l.id ? (
            <form
              key={l.id}
              action={(fd) => {
                fd.set("id", l.id);
                startTransition(async () => {
                  await renameLabel(fd);
                  setEditing(null);
                  router.refresh();
                });
              }}
              className="flex flex-wrap items-center gap-2 px-4 py-3"
            >
              <input name="name" defaultValue={l.name} required className="field flex-1" />
              <div className="flex gap-1.5">
                {COLOURS.map((c) => (
                  <label key={c} className="cursor-pointer">
                    <input type="radio" name="colour" value={c} defaultChecked={l.colour === c} className="peer sr-only" />
                    <span
                      className="block h-5 w-5 rounded-full ring-offset-2 ring-offset-surface peer-checked:ring-2 peer-checked:ring-ink"
                      style={{ background: c }}
                    />
                  </label>
                ))}
              </div>
              <button type="submit" className="btn-primary px-3 py-1 text-xs">Save</button>
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost px-3 py-1 text-xs">
                Cancel
              </button>
            </form>
          ) : (
            <div key={l.id} className="flex items-center justify-between px-4 py-3">
              <Link href={`/filters?label=${l.id}`} className="flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full" style={{ background: l.colour ?? "#a49d90" }} />
                <span className="text-sm font-medium text-ink">{l.name}</span>
                <span className="text-xs text-faint">{l.count} task{l.count === 1 ? "" : "s"}</span>
              </Link>
              <div className="flex items-center gap-3 text-xs">
                <button onClick={() => setEditing(l.id)} className="text-muted hover:text-ink">
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (!confirm(`Delete label “${l.name}”?`)) return;
                    startTransition(async () => {
                      await deleteLabel(l.id);
                      router.refresh();
                    });
                  }}
                  className="text-red-500 hover:text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
