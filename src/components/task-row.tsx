"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleTask, deleteTask } from "@/actions/tasks";
import { PRIORITY_META, formatDueDate } from "@/lib/format";
import { TaskDetailModal } from "./task-detail";
import { showToast } from "./toaster";
import type { LabelView, MemberOption, ProjectOption, TaskView } from "@/lib/view-types";

export function TaskRow({
  task,
  projects,
  members,
  labels = [],
  showProject = true,
}: {
  task: TaskView;
  projects: ProjectOption[];
  members: MemberOption[];
  labels?: LabelView[];
  showProject?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const completed = task.status === "COMPLETED";
  const due = formatDueDate(task.dueDate);
  const prio = PRIORITY_META[task.priority];

  function onToggle() {
    const fd = new FormData();
    fd.set("id", task.id);
    startTransition(async () => {
      await toggleTask(fd);
      router.refresh();
    });
  }

  function onDelete() {
    const fd = new FormData();
    fd.set("id", task.id);
    startTransition(async () => {
      await deleteTask(fd);
      showToast({ message: "Task deleted", undoTaskId: task.id });
      router.refresh();
    });
  }

  return (
    <>
      <li className="group rounded-xl border border-transparent transition hover:border-line hover:bg-surface">
        <div className="flex items-start gap-3 px-3 py-2.5">
          <button
            onClick={onToggle}
            disabled={pending}
            aria-label={completed ? "Re-open task" : "Complete task"}
            className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 transition ${
              completed ? "border-clay bg-clay text-white" : `${prio.text} border-current hover:bg-clay/10`
            }`}
          >
            {completed && (
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-full w-full p-0.5">
                <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 111.4-1.4l3.3 3.3 6.8-6.8a1 1 0 011.9.5z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setOpen(true)}>
            <p className={`text-sm ${completed ? "text-faint line-through" : "text-ink"}`}>{task.title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-faint">
              {due && (
                <span className={due.overdue && !completed ? "font-medium text-red-500" : ""}>🗓 {due.label}</span>
              )}
              {task.priority !== "P4" && (
                <span className="inline-flex items-center gap-1">
                  <span className={`h-2 w-2 rounded-full ${prio.dot}`} />
                  {task.priority}
                </span>
              )}
              {showProject && (
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: task.projectColour ?? "#a49d90" }} />
                  {task.projectName}
                </span>
              )}
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

          <button
            onClick={onDelete}
            disabled={pending}
            aria-label="Delete task"
            className="text-faint opacity-0 transition hover:text-red-500 group-hover:opacity-100"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M8.75 1a1 1 0 00-.98.8L7.5 3H4a1 1 0 000 2h.09l.82 11.4A2 2 0 006.9 18h6.2a2 2 0 001.99-1.6L15.91 5H16a1 1 0 100-2h-3.5l-.27-1.2a1 1 0 00-.98-.8h-2.5zM9 7a1 1 0 011 1v6a1 1 0 11-2 0V8a1 1 0 011-1zm4 1a1 1 0 10-2 0v6a1 1 0 102 0V8z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </li>

      {open && (
        <TaskDetailModal
          taskId={task.id}
          projects={projects}
          members={members}
          labels={labels}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
