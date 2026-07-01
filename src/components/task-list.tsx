import { TaskRow } from "./task-row";
import type { LabelView, MemberOption, ProjectOption, TaskView } from "@/lib/view-types";

export function TaskList({
  tasks,
  projects,
  members,
  labels = [],
  showProject = true,
  emptyMessage = "Nothing here yet.",
}: {
  tasks: TaskView[];
  projects: ProjectOption[];
  members: MemberOption[];
  labels?: LabelView[];
  showProject?: boolean;
  emptyMessage?: string;
}) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-faint">
        {emptyMessage}
      </div>
    );
  }
  return (
    <ul className="space-y-0.5">
      {tasks.map((t) => (
        <TaskRow
          key={t.id}
          task={t}
          projects={projects}
          members={members}
          labels={labels}
          showProject={showProject}
        />
      ))}
    </ul>
  );
}

export function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div className="mb-2 mt-4 flex items-center gap-2 px-1 first:mt-0">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{title}</h2>
      {count !== undefined && (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ink/5 px-1.5 text-[11px] font-medium text-muted">
          {count}
        </span>
      )}
    </div>
  );
}
