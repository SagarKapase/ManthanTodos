import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { taskInclude, notDeleted } from "@/lib/queries";
import { getLabelOptions, getMemberOptions, getProjectOptions } from "@/lib/workspace";
import { toTaskView } from "@/lib/view-types";
import { PageHeader } from "@/components/page-header";
import { QuickAdd } from "@/components/quick-add";
import { TaskList, SectionHeader } from "@/components/task-list";
import { ProjectSettings } from "@/components/project-settings";
import { Board, type BoardColumn } from "@/components/board";

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const { view } = await searchParams;
  const isBoard = view === "board";

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) notFound();

  const [projects, members, labels, sections, allRaw] = await Promise.all([
    getProjectOptions(),
    getMemberOptions(),
    getLabelOptions(),
    prisma.section.findMany({ where: { projectId: id }, orderBy: { order: "asc" } }),
    prisma.task.findMany({
      where: { ...notDeleted, projectId: id },
      include: taskInclude,
      orderBy: [{ sortOrder: "asc" }, { dueDate: { sort: "asc", nulls: "last" } }, { priority: "asc" }],
    }),
  ]);

  const all = allRaw.map(toTaskView);
  const open = all.filter((t) => t.status === "OPEN");
  const done = all.filter((t) => t.status === "COMPLETED");

  const toggle = (
    <div className="flex items-center gap-1 rounded-lg border border-line bg-surface p-0.5 text-sm">
      <Link
        href={`/projects/${id}`}
        className={`rounded-md px-3 py-1 ${!isBoard ? "bg-clay-soft font-medium text-clay" : "text-muted"}`}
      >
        List
      </Link>
      <Link
        href={`/projects/${id}?view=board`}
        className={`rounded-md px-3 py-1 ${isBoard ? "bg-clay-soft font-medium text-clay" : "text-muted"}`}
      >
        Board
      </Link>
    </div>
  );

  return (
    <>
      <PageHeader
        title={project.name}
        subtitle={project.status === "ARCHIVED" ? "Archived project" : `${open.length} open · ${done.length} completed`}
      >
        <div className="flex items-center gap-2">
          {toggle}
          <ProjectSettings project={project} />
        </div>
      </PageHeader>

      {isBoard ? (
        <Board
          projectId={id}
          projects={projects}
          members={members}
          labels={labels}
          initialColumns={buildColumns(sections, all)}
        />
      ) : (
        <>
          <div className="mb-4">
            <QuickAdd projects={projects} members={members} labels={labels} defaultProjectId={id} />
          </div>
          <section className="mb-4">
            <SectionHeader title="Open" count={open.length} />
            <TaskList
              tasks={open}
              projects={projects}
              members={members}
              labels={labels}
              showProject={false}
              emptyMessage="No open tasks in this project."
            />
          </section>
          {done.length > 0 && (
            <section>
              <SectionHeader title="Completed" count={done.length} />
              <TaskList tasks={done} projects={projects} members={members} labels={labels} showProject={false} />
            </section>
          )}
        </>
      )}
    </>
  );
}

function buildColumns(
  sections: { id: string; name: string }[],
  tasks: ReturnType<typeof toTaskView>[]
): BoardColumn[] {
  const columns: BoardColumn[] = [
    { id: null, name: "No section", tasks: tasks.filter((t) => !t.sectionId) },
    ...sections.map((s) => ({ id: s.id, name: s.name, tasks: tasks.filter((t) => t.sectionId === s.id) })),
  ];
  return columns;
}
