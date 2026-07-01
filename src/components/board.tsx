"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { moveTask, createTask } from "@/actions/tasks";
import { createSection, renameSection, deleteSection } from "@/actions/sections";
import { TaskDetailModal } from "./task-detail";
import { PRIORITY_META, formatDueDate } from "@/lib/format";
import type { LabelView, MemberOption, ProjectOption, TaskView } from "@/lib/view-types";

export type BoardColumn = { id: string | null; name: string; tasks: TaskView[] };

export function Board({
  projectId,
  initialColumns,
  projects,
  members,
  labels,
}: {
  projectId: string;
  initialColumns: BoardColumn[];
  projects: ProjectOption[];
  members: MemberOption[];
  labels: LabelView[];
}) {
  const router = useRouter();
  const [columns, setColumns] = useState<BoardColumn[]>(initialColumns);
  const [dragId, setDragId] = useState<string | null>(null);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [addingSection, setAddingSection] = useState(false);
  const [, startTransition] = useTransition();

  // Re-sync from the server only when the real order/content changes.
  const sig = useMemo(
    () => JSON.stringify(initialColumns.map((c) => [c.id, c.tasks.map((t) => t.id)])),
    [initialColumns]
  );
  useEffect(() => {
    setColumns(initialColumns);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  function persist(taskId: string, colId: string | null, orderedIds: string[]) {
    startTransition(async () => {
      await moveTask({ taskId, sectionId: colId, orderedIds });
      router.refresh();
    });
  }

  function moveLocally(taskId: string, targetColId: string | null, beforeId: string | null) {
    setColumns((prev) => {
      const cols = prev.map((c) => ({ ...c, tasks: [...c.tasks] }));
      let moved: TaskView | undefined;
      for (const c of cols) {
        const i = c.tasks.findIndex((t) => t.id === taskId);
        if (i >= 0) {
          moved = c.tasks.splice(i, 1)[0];
          break;
        }
      }
      if (!moved) return prev;
      const target = cols.find((c) => c.id === targetColId);
      if (!target) return prev;
      const idx = beforeId ? target.tasks.findIndex((t) => t.id === beforeId) : target.tasks.length;
      target.tasks.splice(idx < 0 ? target.tasks.length : idx, 0, moved);
      persist(taskId, targetColId, target.tasks.map((t) => t.id));
      return cols;
    });
  }

  return (
    <>
      <div className="flex items-start gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <div
            key={col.id ?? "none"}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragId) moveLocally(dragId, col.id, null);
              setDragId(null);
            }}
            className="flex w-72 shrink-0 flex-col rounded-2xl bg-sidebar/60 p-2"
          >
            <SectionHead col={col} onChanged={() => router.refresh()} />

            <div className="flex flex-col gap-2">
              {col.tasks.map((t) => (
                <div
                  key={t.id}
                  draggable
                  onDragStart={() => setDragId(t.id)}
                  onDragEnd={() => setDragId(null)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (dragId && dragId !== t.id) moveLocally(dragId, col.id, t.id);
                    setDragId(null);
                  }}
                >
                  <BoardCard task={t} onOpen={() => setOpenTaskId(t.id)} />
                </div>
              ))}
            </div>

            <BoardAddTask projectId={projectId} sectionId={col.id} onAdded={() => router.refresh()} />
          </div>
        ))}

        {/* Add section */}
        <div className="w-72 shrink-0">
          {addingSection ? (
            <form
              action={(fd) => {
                fd.set("projectId", projectId);
                startTransition(async () => {
                  await createSection(fd);
                  setAddingSection(false);
                  router.refresh();
                });
              }}
              className="rounded-2xl bg-sidebar/60 p-2"
            >
              <input name="name" placeholder="Section name" autoFocus required className="field w-full" />
            </form>
          ) : (
            <button
              onClick={() => setAddingSection(true)}
              className="w-full rounded-2xl border border-dashed border-line px-3 py-2 text-sm text-muted transition hover:bg-sidebar/60"
            >
              + Add section
            </button>
          )}
        </div>
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

function SectionHead({ col, onChanged }: { col: BoardColumn; onChanged: () => void }) {
  const [menu, setMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [, startTransition] = useTransition();

  return (
    <div className="mb-2 flex items-center justify-between px-1.5 py-1">
      {renaming && col.id ? (
        <form
          action={(fd) => {
            fd.set("id", col.id!);
            startTransition(async () => {
              await renameSection(fd);
              setRenaming(false);
              onChanged();
            });
          }}
          className="flex-1"
        >
          <input name="name" defaultValue={col.name} autoFocus required className="field w-full" />
        </form>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ink">{col.name}</span>
          <span className="text-xs text-faint">{col.tasks.length}</span>
        </div>
      )}
      {col.id && !renaming && (
        <div className="relative">
          <button onClick={() => setMenu((m) => !m)} className="px-1 text-faint hover:text-ink" aria-label="Section menu">
            ⋯
          </button>
          {menu && (
            <div className="card absolute right-0 z-20 mt-1 w-40 p-1 text-sm shadow-lg">
              <button
                onClick={() => {
                  setRenaming(true);
                  setMenu(false);
                }}
                className="block w-full rounded-lg px-2 py-1.5 text-left text-muted hover:bg-ink/5"
              >
                Rename
              </button>
              <button
                onClick={() => {
                  if (!confirm(`Delete section “${col.name}”? Its tasks move to No section.`)) return;
                  startTransition(async () => {
                    await deleteSection(col.id!);
                    setMenu(false);
                    onChanged();
                  });
                }}
                className="block w-full rounded-lg px-2 py-1.5 text-left text-red-500 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BoardCard({ task, onOpen }: { task: TaskView; onOpen: () => void }) {
  const prio = PRIORITY_META[task.priority];
  const due = formatDueDate(task.dueDate);
  const completed = task.status === "COMPLETED";
  return (
    <button onClick={onOpen} className="card w-full cursor-grab p-3 text-left active:cursor-grabbing">
      <p className={`text-sm ${completed ? "text-faint line-through" : "text-ink"}`}>{task.title}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-faint">
        {task.priority !== "P4" && (
          <span className="inline-flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${prio.dot}`} />
            {task.priority}
          </span>
        )}
        {due && <span className={due.overdue && !completed ? "font-medium text-red-500" : ""}>🗓 {due.label}</span>}
        {task.labels.map((l) => (
          <span key={l.id} className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ background: l.colour ?? "#a49d90" }} />
            {l.name}
          </span>
        ))}
        {task.assigneeName && <span>👤 {task.assigneeName}</span>}
        {task.commentCount > 0 && <span>💬 {task.commentCount}</span>}
      </div>
    </button>
  );
}

function BoardAddTask({
  projectId,
  sectionId,
  onAdded,
}: {
  projectId: string;
  sectionId: string | null;
  onAdded: () => void;
}) {
  const [active, setActive] = useState(false);
  const [, startTransition] = useTransition();
  const ref = useRef<HTMLInputElement>(null);

  if (!active) {
    return (
      <button
        onClick={() => setActive(true)}
        className="mt-2 w-full rounded-lg px-2 py-1.5 text-left text-sm text-faint transition hover:bg-ink/5 hover:text-muted"
      >
        + Add task
      </button>
    );
  }

  return (
    <form
      action={(fd) => {
        fd.set("projectId", projectId);
        if (sectionId) fd.set("sectionId", sectionId);
        startTransition(async () => {
          await createTask(fd);
          if (ref.current) ref.current.value = "";
          onAdded();
        });
      }}
      className="mt-2"
    >
      <input ref={ref} name="title" placeholder="Task title…" autoFocus required className="field w-full" />
      <div className="mt-1 flex gap-1">
        <button type="submit" className="btn-primary px-3 py-1 text-xs">Add</button>
        <button type="button" onClick={() => setActive(false)} className="btn-ghost px-3 py-1 text-xs">
          Cancel
        </button>
      </div>
    </form>
  );
}
