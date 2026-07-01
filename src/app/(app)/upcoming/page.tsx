import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { taskInclude, notDeleted, startOfToday } from "@/lib/queries";
import { getLabelOptions, getMemberOptions, getProjectOptions } from "@/lib/workspace";
import { toTaskView, type TaskView } from "@/lib/view-types";
import { formatDueDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { QuickAdd } from "@/components/quick-add";
import { TaskList, SectionHeader } from "@/components/task-list";

export const metadata = { title: "Upcoming · Manthan" };

export default async function UpcomingPage() {
  await requireUser();
  const [projects, members, labels, datedRaw, undatedRaw] = await Promise.all([
    getProjectOptions(),
    getMemberOptions(),
    getLabelOptions(),
    prisma.task.findMany({
      where: { ...notDeleted, status: "OPEN", dueDate: { gte: startOfToday() } },
      include: taskInclude,
      orderBy: [{ dueDate: "asc" }, { priority: "asc" }],
    }),
    prisma.task.findMany({
      where: { ...notDeleted, status: "OPEN", dueDate: null },
      include: taskInclude,
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  // Group dated tasks by calendar day.
  const groups = new Map<string, TaskView[]>();
  for (const t of datedRaw.map(toTaskView)) {
    const key = new Date(t.dueDate!).toISOString().slice(0, 10);
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(t);
  }
  const orderedKeys = [...groups.keys()].sort();
  const undated = undatedRaw.map(toTaskView);

  return (
    <>
      <PageHeader title="Upcoming" subtitle="Everything ahead, by day" />
      <div className="mb-4">
        <QuickAdd projects={projects} members={members} labels={labels} />
      </div>

      {orderedKeys.length === 0 && undated.length === 0 && (
        <div className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-faint">
          No upcoming tasks. Add one above.
        </div>
      )}

      {orderedKeys.map((key) => {
        const tasks = groups.get(key)!;
        const label = formatDueDate(key)?.label ?? key;
        return (
          <section key={key} className="mb-4">
            <SectionHeader title={label} count={tasks.length} />
            <TaskList tasks={tasks} projects={projects} members={members} labels={labels} />
          </section>
        );
      })}

      {undated.length > 0 && (
        <section className="mb-4">
          <SectionHeader title="No due date" count={undated.length} />
          <TaskList tasks={undated} projects={projects} members={members} labels={labels} />
        </section>
      )}
    </>
  );
}
