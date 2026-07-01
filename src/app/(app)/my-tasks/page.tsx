import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { taskInclude, notDeleted } from "@/lib/queries";
import { getLabelOptions, getMemberOptions, getProjectOptions } from "@/lib/workspace";
import { toTaskView } from "@/lib/view-types";
import { PageHeader } from "@/components/page-header";
import { QuickAdd } from "@/components/quick-add";
import { TaskList, SectionHeader } from "@/components/task-list";

export const metadata = { title: "My Tasks · Manthan" };

export default async function MyTasksPage() {
  const user = await requireUser();
  const [projects, members, labels, openRaw, doneRaw] = await Promise.all([
    getProjectOptions(),
    getMemberOptions(),
    getLabelOptions(),
    prisma.task.findMany({
      where: { ...notDeleted, assigneeId: user.id, status: "OPEN" },
      include: taskInclude,
      orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { priority: "asc" }],
    }),
    prisma.task.findMany({
      where: { ...notDeleted, assigneeId: user.id, status: "COMPLETED" },
      include: taskInclude,
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
  ]);

  const open = openRaw.map(toTaskView);
  const done = doneRaw.map(toTaskView);

  return (
    <>
      <PageHeader title="My Tasks" subtitle="Everything assigned to you" />
      <div className="mb-4">
        <QuickAdd projects={projects} members={members} labels={labels} defaultAssigneeId={user.id} />
      </div>

      <section className="mb-4">
        <SectionHeader title="Open" count={open.length} />
        <TaskList
          tasks={open}
          projects={projects}
          members={members}
          labels={labels}
          emptyMessage="No open tasks assigned to you. 🎉"
        />
      </section>

      {done.length > 0 && (
        <section>
          <SectionHeader title="Recently completed" count={done.length} />
          <TaskList tasks={done} projects={projects} members={members} labels={labels} />
        </section>
      )}
    </>
  );
}
