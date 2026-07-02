"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { moveTask, createTask } from "@/actions/tasks";
import { createSection, renameSection, deleteSection } from "@/actions/sections";
import { TaskDetailModal } from "./task-detail";
import { PRIORITY_META, formatDueDate } from "@/lib/format";
import type { LabelView, MemberOption, ProjectOption, TaskView } from "@/lib/view-types";

export type BoardColumn = { id: string | null; name: string; tasks: TaskView[] };

const NONE = "__none__";
const keyOf = (id: string | null) => id ?? NONE;
const sectionIdOf = (key: string) => (key === NONE ? null : key);

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
  const [, startTransition] = useTransition();

  // Local board state: ordered column keys, task-ids per column, and a task lookup.
  const [order, setOrder] = useState<string[]>(() => initialColumns.map((c) => keyOf(c.id)));
  const [items, setItems] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(initialColumns.map((c) => [keyOf(c.id), c.tasks.map((t) => t.id)]))
  );
  const meta = useMemo(() => {
    const m: Record<string, { name: string; sectionId: string | null }> = {};
    for (const c of initialColumns) m[keyOf(c.id)] = { name: c.name, sectionId: c.id };
    return m;
  }, [initialColumns]);
  const tasksById = useMemo(() => {
    const m: Record<string, TaskView> = {};
    for (const c of initialColumns) for (const t of c.tasks) m[t.id] = t;
    return m;
  }, [initialColumns]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [addingSection, setAddingSection] = useState(false);

  // Re-sync from the server only when the underlying order actually changes.
  const sig = useMemo(
    () => JSON.stringify(initialColumns.map((c) => [keyOf(c.id), c.tasks.map((t) => t.id)])),
    [initialColumns]
  );
  useEffect(() => {
    setOrder(initialColumns.map((c) => keyOf(c.id)));
    setItems(Object.fromEntries(initialColumns.map((c) => [keyOf(c.id), c.tasks.map((t) => t.id)])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } })
  );

  function findContainer(id: string): string | undefined {
    if (id in items) return id;
    return order.find((key) => items[key]?.includes(id));
  }

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const activeC = findContainer(String(active.id));
    const overC = findContainer(String(over.id)) ?? (String(over.id) in items ? String(over.id) : undefined);
    if (!activeC || !overC || activeC === overC) return;

    setItems((prev) => {
      const activeItems = prev[activeC];
      const overItems = prev[overC];
      const activeIndex = activeItems.indexOf(String(active.id));
      const overIndex = overItems.indexOf(String(over.id));
      const insertAt = overIndex >= 0 ? overIndex : overItems.length;
      return {
        ...prev,
        [activeC]: activeItems.filter((id) => id !== String(active.id)),
        [overC]: [...overItems.slice(0, insertAt), String(active.id), ...overItems.slice(insertAt)],
      };
    });
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;
    const activeC = findContainer(String(active.id));
    const overC = findContainer(String(over.id)) ?? (String(over.id) in items ? String(over.id) : undefined);
    if (!activeC || !overC) return;

    let finalIds = items[overC];
    if (activeC === overC) {
      const oldIndex = items[overC].indexOf(String(active.id));
      const newIndex = items[overC].indexOf(String(over.id));
      if (oldIndex !== newIndex && newIndex >= 0) {
        finalIds = arrayMove(items[overC], oldIndex, newIndex);
        setItems((prev) => ({ ...prev, [overC]: finalIds }));
      }
    }
    // Persist the moved task's new section + the column's new order.
    startTransition(async () => {
      await moveTask({ taskId: String(active.id), sectionId: sectionIdOf(overC), orderedIds: finalIds });
      router.refresh();
    });
  }

  const activeTask = activeId ? tasksById[activeId] : null;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="flex items-start gap-4 overflow-x-auto pb-4">
          {order.map((key) => (
            <Column
              key={key}
              colKey={key}
              name={meta[key]?.name ?? "Section"}
              sectionId={meta[key]?.sectionId ?? null}
              taskIds={items[key] ?? []}
              tasksById={tasksById}
              projectId={projectId}
              onOpen={setOpenTaskId}
              onChanged={() => router.refresh()}
            />
          ))}

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
                className="w-full rounded-2xl border border-dashed border-line px-3 py-2.5 text-sm text-muted transition hover:bg-sidebar/60"
              >
                + Add section
              </button>
            )}
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask ? <Cardface task={activeTask} dragging /> : null}
        </DragOverlay>
      </DndContext>

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

function Column({
  colKey,
  name,
  sectionId,
  taskIds,
  tasksById,
  projectId,
  onOpen,
  onChanged,
}: {
  colKey: string;
  name: string;
  sectionId: string | null;
  taskIds: string[];
  tasksById: Record<string, TaskView>;
  projectId: string;
  onOpen: (id: string) => void;
  onChanged: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: colKey });

  return (
    <div className={`flex max-h-[calc(100vh-11rem)] w-72 shrink-0 flex-col rounded-2xl bg-sidebar/50 transition ${isOver ? "ring-2 ring-clay/30" : ""}`}>
      <SectionHead name={name} sectionId={sectionId} count={taskIds.length} onChanged={onChanged} />
      <div ref={setNodeRef} className="flex-1 overflow-y-auto px-2">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div className="flex min-h-2 flex-col gap-2 pb-1">
            {taskIds.map((id) => (
              <SortableCard key={id} task={tasksById[id]} onOpen={() => onOpen(id)} />
            ))}
          </div>
        </SortableContext>
      </div>
      <BoardAddTask projectId={projectId} sectionId={sectionId} onAdded={onChanged} />
    </div>
  );
}

function SortableCard({ task, onOpen }: { task: TaskView; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Cardface task={task} onOpen={onOpen} />
    </div>
  );
}

function Cardface({ task, onOpen, dragging }: { task: TaskView; onOpen?: () => void; dragging?: boolean }) {
  const prio = PRIORITY_META[task.priority];
  const due = formatDueDate(task.dueDate);
  const completed = task.status === "COMPLETED";
  return (
    <div
      onClick={onOpen}
      className={`card cursor-grab p-3 active:cursor-grabbing ${dragging ? "rotate-2 shadow-lg" : ""}`}
    >
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
        {task.subTaskCount > 0 && <span>☑ {task.subTaskCount}</span>}
        {task.commentCount > 0 && <span>💬 {task.commentCount}</span>}
      </div>
    </div>
  );
}

function SectionHead({
  name,
  sectionId,
  count,
  onChanged,
}: {
  name: string;
  sectionId: string | null;
  count: number;
  onChanged: () => void;
}) {
  const [menu, setMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between px-3 py-2.5">
      {renaming && sectionId ? (
        <form
          action={(fd) => {
            fd.set("id", sectionId);
            startTransition(async () => {
              await renameSection(fd);
              setRenaming(false);
              onChanged();
            });
          }}
          className="flex-1"
        >
          <input name="name" defaultValue={name} autoFocus required className="field w-full" />
        </form>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ink">{name}</span>
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ink/5 px-1.5 text-[11px] font-medium text-muted">
            {count}
          </span>
        </div>
      )}
      {sectionId && !renaming && (
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
                  if (!confirm(`Delete section “${name}”? Its tasks move to No section.`)) return;
                  startTransition(async () => {
                    await deleteSection(sectionId);
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
        className="m-2 rounded-lg px-2 py-1.5 text-left text-sm text-faint transition hover:bg-ink/5 hover:text-muted"
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
      className="m-2"
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
