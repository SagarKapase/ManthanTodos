"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markNotificationRead, markAllNotificationsRead } from "@/actions/notifications";
import { TaskDetailModal } from "./task-detail";
import type { LabelView, MemberOption, ProjectOption } from "@/lib/view-types";

type Item = { id: string; message: string; taskId: string | null; read: boolean; createdAt: string };

export function NotificationsList({
  items,
  projects,
  members,
  labels,
}: {
  items: Item[];
  projects: ProjectOption[];
  members: MemberOption[];
  labels: LabelView[];
}) {
  const router = useRouter();
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const unread = items.filter((i) => !i.read).length;

  function open(item: Item) {
    if (!item.read) {
      startTransition(async () => {
        await markNotificationRead(item.id);
        router.refresh();
      });
    }
    if (item.taskId) setOpenTaskId(item.taskId);
  }

  return (
    <>
      <div className="mb-3 flex justify-end">
        <button
          disabled={unread === 0}
          onClick={() =>
            startTransition(async () => {
              await markAllNotificationsRead();
              router.refresh();
            })
          }
          className="btn-ghost px-3 py-1.5 disabled:opacity-40"
        >
          Mark all read
        </button>
      </div>

      <div className="card divide-y divide-line">
        {items.length === 0 && <p className="px-4 py-10 text-center text-sm text-faint">You&apos;re all caught up. 🎉</p>}
        {items.map((n) => (
          <button
            key={n.id}
            onClick={() => open(n)}
            className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-ink/[0.03]"
          >
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-clay"}`} />
            <div className="min-w-0 flex-1">
              <p className={`text-sm ${n.read ? "text-muted" : "text-ink"}`}>{n.message}</p>
              <p className="mt-0.5 text-xs text-faint">
                {new Date(n.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </button>
        ))}
      </div>

      {openTaskId && (
        <TaskDetailModal
          taskId={openTaskId}
          projects={projects}
          members={members}
          labels={labels}
          onClose={() => setOpenTaskId(null)}
        />
      )}
    </>
  );
}
