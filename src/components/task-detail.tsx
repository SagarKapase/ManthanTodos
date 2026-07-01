"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getTaskDetail } from "@/actions/task-detail";
import { updateTask, toggleTask, deleteTask, createSubtask } from "@/actions/tasks";
import { addComment } from "@/actions/comments";
import { TaskFields } from "./task-fields";
import { showToast } from "./toaster";
import { PRIORITY_META } from "@/lib/format";
import { toDateInputValue } from "@/lib/format";
import type { LabelView, MemberOption, ProjectOption, TaskDetail } from "@/lib/view-types";

export function TaskDetailModal({
  taskId,
  projects,
  members,
  labels,
  onClose,
}: {
  taskId: string;
  projects: ProjectOption[];
  members: MemberOption[];
  labels: LabelView[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [detail, setDetail] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const subInputRef = useRef<HTMLInputElement>(null);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    const d = await getTaskDetail(taskId);
    setDetail(d);
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    load();
  }, [load]);

  // Close on Escape.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function refresh() {
    router.refresh();
    load();
  }

  function onSave(formData: FormData) {
    formData.set("id", taskId);
    setError(null);
    startTransition(async () => {
      const res = await updateTask(formData);
      if (res?.error) return setError(res.error);
      refresh();
    });
  }

  function onToggleMain() {
    const fd = new FormData();
    fd.set("id", taskId);
    startTransition(async () => {
      await toggleTask(fd);
      refresh();
    });
  }

  function onDelete() {
    if (!confirm(`Delete “${detail?.title}”?`)) return;
    const fd = new FormData();
    fd.set("id", taskId);
    startTransition(async () => {
      await deleteTask(fd);
      showToast({ message: "Task deleted", undoTaskId: taskId });
      onClose();
      router.refresh();
    });
  }

  function onAddSub() {
    const title = subInputRef.current?.value ?? "";
    if (!title.trim()) return;
    startTransition(async () => {
      await createSubtask(taskId, title);
      if (subInputRef.current) subInputRef.current.value = "";
      refresh();
    });
  }

  function onToggleSub(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      await toggleTask(fd);
      refresh();
    });
  }

  function onAddComment(formData: FormData) {
    formData.set("taskId", taskId);
    startTransition(async () => {
      const res = await addComment(formData);
      if (!res?.error && commentRef.current) commentRef.current.value = "";
      refresh();
    });
  }

  const prio = detail ? PRIORITY_META[detail.priority] : null;
  const doneSubs = detail?.subTasks.filter((s) => s.status === "COMPLETED").length ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm sm:p-8"
      onClick={onClose}
    >
      <div
        className="card my-4 w-full max-w-2xl p-0"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {loading || !detail ? (
          <div className="p-8 text-center text-sm text-faint">{loading ? "Loading…" : "Task not found."}</div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start gap-3 border-b border-line px-5 py-4">
              <button
                onClick={onToggleMain}
                aria-label={detail.status === "COMPLETED" ? "Re-open" : "Complete"}
                className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 transition ${
                  detail.status === "COMPLETED"
                    ? "border-clay bg-clay text-white"
                    : `${prio!.text} border-current hover:bg-clay/10`
                }`}
              >
                {detail.status === "COMPLETED" && (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-full w-full p-0.5">
                    <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 111.4-1.4l3.3 3.3 6.8-6.8a1 1 0 011.9.5z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              <div className="min-w-0 flex-1">
                <h2 className={`font-serif text-xl font-semibold ${detail.status === "COMPLETED" ? "text-faint line-through" : "text-ink"}`}>
                  {detail.title}
                </h2>
                <p className="mt-0.5 text-xs text-faint">
                  in {detail.projectName} · added by {detail.createdByName}
                </p>
              </div>
              <button onClick={onClose} aria-label="Close" className="btn-ghost px-2 py-1">✕</button>
            </div>

            <div className="max-h-[70vh] space-y-6 overflow-y-auto px-5 py-5">
              {/* Edit form */}
              <form action={onSave} className="space-y-3">
                <input name="title" defaultValue={detail.title} required className="input" />
                <TaskFields
                  projects={projects}
                  members={members}
                  labels={labels}
                  sections={detail.sections}
                  defaults={{
                    projectId: detail.projectId,
                    priority: detail.priority,
                    dueDate: toDateInputValue(detail.dueDate),
                    assigneeId: detail.assigneeId ?? "none",
                    description: detail.description,
                    labelIds: detail.labels.map((l) => l.id),
                    sectionId: detail.sectionId ?? "none",
                  }}
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button type="submit" className="btn-primary px-4 py-1.5">Save changes</button>
              </form>

              {/* Sub-tasks */}
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  Sub-tasks {detail.subTasks.length > 0 && `· ${doneSubs}/${detail.subTasks.length}`}
                </h3>
                <ul className="space-y-1">
                  {detail.subTasks.map((s) => (
                    <li key={s.id} className="flex items-center gap-2.5">
                      <button
                        onClick={() => onToggleSub(s.id)}
                        className={`h-4 w-4 shrink-0 rounded-full border-2 transition ${
                          s.status === "COMPLETED" ? "border-clay bg-clay" : "border-line hover:border-clay"
                        }`}
                        aria-label="Toggle sub-task"
                      />
                      <span className={`text-sm ${s.status === "COMPLETED" ? "text-faint line-through" : "text-ink"}`}>
                        {s.title}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex gap-2">
                  <input
                    ref={subInputRef}
                    placeholder="Add a sub-task…"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onAddSub())}
                    className="field flex-1"
                  />
                  <button onClick={onAddSub} className="btn-ghost px-3 py-1.5">Add</button>
                </div>
              </section>

              {/* Comments */}
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  Comments {detail.comments.length > 0 && `· ${detail.comments.length}`}
                </h3>
                <ul className="space-y-3">
                  {detail.comments.map((c) => (
                    <li key={c.id} className="flex gap-2.5">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-clay-soft text-xs font-semibold text-clay">
                        {c.authorName.slice(0, 1).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1 rounded-xl bg-paper px-3 py-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-medium text-ink">{c.authorName}</span>
                          <span className="text-[11px] text-faint">
                            {new Date(c.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink">{c.body}</p>
                      </div>
                    </li>
                  ))}
                  {detail.comments.length === 0 && <li className="text-sm text-faint">No comments yet.</li>}
                </ul>
                <form action={onAddComment} className="mt-3 flex gap-2">
                  <textarea
                    ref={commentRef}
                    name="body"
                    rows={1}
                    placeholder="Write a comment…"
                    required
                    className="input resize-none"
                  />
                  <button type="submit" className="btn-primary shrink-0 px-4 py-2">Send</button>
                </form>
              </section>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-line px-5 py-3">
              <span className="text-xs text-faint">
                Created {new Date(detail.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <button onClick={onDelete} className="text-sm text-red-500 transition hover:text-red-600">
                Delete task
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
