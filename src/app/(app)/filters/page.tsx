import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { taskInclude, notDeleted } from "@/lib/queries";
import { getLabelOptions, getMemberOptions, getProjectOptions } from "@/lib/workspace";
import { toTaskView } from "@/lib/view-types";
import type { Prisma } from "@prisma/client";
import { PageHeader } from "@/components/page-header";
import { TaskList, SectionHeader } from "@/components/task-list";

export const metadata = { title: "Filters · Manthan" };

type SP = { assignee?: string; project?: string; priority?: string; label?: string; status?: string };

const field = "field";

export default async function FiltersPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireUser();
  const sp = await searchParams;

  const [projects, members, labels] = await Promise.all([
    getProjectOptions(),
    getMemberOptions(),
    getLabelOptions(),
  ]);

  const where: Prisma.TaskWhereInput = { ...notDeleted };
  if (sp.assignee) where.assigneeId = sp.assignee === "unassigned" ? null : sp.assignee;
  if (sp.project) where.projectId = sp.project;
  if (sp.priority) where.priority = sp.priority as Prisma.TaskWhereInput["priority"];
  if (sp.label) where.labels = { some: { id: sp.label } };
  where.status = sp.status === "COMPLETED" ? "COMPLETED" : sp.status === "ANY" ? undefined : "OPEN";

  const results = (
    await prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { priority: "asc" }],
      take: 200,
    })
  ).map(toTaskView);

  return (
    <>
      <PageHeader title="Filters" subtitle="Slice tasks by assignee, project, priority, or label" />

      <form method="get" className="card mb-5 flex flex-wrap items-end gap-3 p-4">
        <Select name="assignee" label="Assignee" value={sp.assignee}>
          <option value="">Anyone</option>
          <option value="unassigned">Unassigned</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </Select>
        <Select name="project" label="Project" value={sp.project}>
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>
        <Select name="priority" label="Priority" value={sp.priority}>
          <option value="">Any</option>
          <option value="P1">P1</option>
          <option value="P2">P2</option>
          <option value="P3">P3</option>
          <option value="P4">P4</option>
        </Select>
        <Select name="label" label="Label" value={sp.label}>
          <option value="">Any</option>
          {labels.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </Select>
        <Select name="status" label="Status" value={sp.status}>
          <option value="OPEN">Open</option>
          <option value="COMPLETED">Completed</option>
          <option value="ANY">Any</option>
        </Select>
        <button type="submit" className="btn-primary px-4 py-2">Apply</button>
      </form>

      <section>
        <SectionHeader title="Matching tasks" count={results.length} />
        <TaskList
          tasks={results}
          projects={projects}
          members={members}
          labels={labels}
          emptyMessage="No tasks match these filters."
        />
      </section>
    </>
  );
}

function Select({
  name,
  label,
  value,
  children,
}: {
  name: string;
  label: string;
  value?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-[11px] font-medium uppercase tracking-wide text-faint">
      {label}
      <select name={name} defaultValue={value ?? ""} className={field}>
        {children}
      </select>
    </label>
  );
}
