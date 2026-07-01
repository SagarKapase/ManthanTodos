"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { restoreTask, purgeTask } from "@/actions/tasks";

type TrashRow = { id: string; title: string; projectName: string; projectColour: string | null; deletedAt: string };

export function TrashList({ tasks }: { tasks: TrashRow[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-sm text-faint">
        Trash is empty.
      </div>
    );
  }

  return (
    <div className="card divide-y divide-line">
      {tasks.map((t) => (
        <div key={t.id} className="flex items-center justify-between px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm text-ink">{t.title}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-faint">
              <span className="h-2 w-2 rounded-full" style={{ background: t.projectColour ?? "#a49d90" }} />
              {t.projectName} · deleted{" "}
              {new Date(t.deletedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={() =>
                startTransition(async () => {
                  await restoreTask(t.id);
                  router.refresh();
                })
              }
              className="font-medium text-clay hover:text-clay-dark"
            >
              Restore
            </button>
            <button
              onClick={() => {
                if (!confirm(`Permanently delete “${t.title}”? This cannot be undone.`)) return;
                startTransition(async () => {
                  await purgeTask(t.id);
                  router.refresh();
                });
              }}
              className="text-red-500 hover:text-red-600"
            >
              Delete forever
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
