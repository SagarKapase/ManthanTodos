import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { taskInclude, notDeleted, startOfToday, endOfToday } from "@/lib/queries";
import { getLabelOptions, getMemberOptions, getProjectOptions } from "@/lib/workspace";
import { toTaskView } from "@/lib/view-types";
import { toDateInputValue } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { QuickAdd } from "@/components/quick-add";
import { TaskList, SectionHeader } from "@/components/task-list";

export const metadata = { title: "Today · Manthan" };

export default async function TodayPage() {
  await requireUser();
  const [projects, members, labels, overdueRaw, todayRaw] = await Promise.all([
    getProjectOptions(),
    getMemberOptions(),
    getLabelOptions(),
    prisma.task.findMany({
      where: { ...notDeleted, status: "OPEN", dueDate: { lt: startOfToday() } },
      include: taskInclude,
      orderBy: [{ dueDate: "asc" }, { priority: "asc" }],
    }),
    prisma.task.findMany({
      where: { ...notDeleted, status: "OPEN", dueDate: { gte: startOfToday(), lte: endOfToday() } },
      include: taskInclude,
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const overdue = overdueRaw.map(toTaskView);
  const today = todayRaw.map(toTaskView);

  return (
    <>
      <PageHeader
        title="Today"
        subtitle={new Date().toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      />
      <div className="mb-4">
        <QuickAdd projects={projects} members={members} labels={labels} defaultDueDate={toDateInputValue(new Date())} />
      </div>

      {overdue.length > 0 && (
        <section className="mb-4">
          <SectionHeader title="Overdue" count={overdue.length} />
          <TaskList tasks={overdue} projects={projects} members={members} labels={labels} />
        </section>
      )}

      <section>
        <SectionHeader title="Due today" count={today.length} />
        <TaskList
          tasks={today}
          projects={projects}
          members={members}
          labels={labels}
          emptyMessage="Nothing due today. Enjoy the calm — or add something above."
        />
      </section>
    </>
  );
}
