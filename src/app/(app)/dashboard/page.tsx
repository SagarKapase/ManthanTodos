import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { taskInclude, notDeleted, startOfToday, endOfToday } from "@/lib/queries";
import { getLabelOptions, getMemberOptions, getProjectOptions } from "@/lib/workspace";
import { toTaskView } from "@/lib/view-types";
import { PageHeader } from "@/components/page-header";
import { TaskList, SectionHeader } from "@/components/task-list";

export const metadata = { title: "Dashboard · Manthan" };

function StatCard({ label, value, href, accent }: { label: string; value: number; href: string; accent: string }) {
  return (
    <Link href={href} className="card p-4 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className={`font-serif text-3xl font-semibold ${accent}`}>{value}</div>
      <div className="mt-0.5 text-xs text-muted">{label}</div>
    </Link>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [projects, members, labels, openCount, overdueCount, completedThisWeek, myOpenCount, todayRaw] =
    await Promise.all([
      getProjectOptions(),
      getMemberOptions(),
      getLabelOptions(),
      prisma.task.count({ where: { ...notDeleted, status: "OPEN" } }),
      prisma.task.count({ where: { ...notDeleted, status: "OPEN", dueDate: { lt: startOfToday() } } }),
      prisma.task.count({ where: { ...notDeleted, status: "COMPLETED", updatedAt: { gte: weekAgo } } }),
      prisma.task.count({ where: { ...notDeleted, status: "OPEN", assigneeId: user.id } }),
      prisma.task.findMany({
        where: { ...notDeleted, status: "OPEN", dueDate: { gte: startOfToday(), lte: endOfToday() } },
        include: taskInclude,
        orderBy: [{ priority: "asc" }],
      }),
    ]);

  const today = todayRaw.map(toTaskView);

  return (
    <>
      <PageHeader title={`Welcome, ${user.name}`} subtitle="Here's where the team stands today." />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Open tasks" value={openCount} href="/upcoming" accent="text-ink" />
        <StatCard label="Overdue" value={overdueCount} href="/today" accent="text-red-500" />
        <StatCard label="Assigned to me" value={myOpenCount} href="/my-tasks" accent="text-blue-600" />
        <StatCard label="Done this week" value={completedThisWeek} href="/my-tasks" accent="text-green-600" />
      </div>

      <section>
        <SectionHeader title="Due today" count={today.length} />
        <TaskList
          tasks={today}
          projects={projects}
          members={members}
          labels={labels}
          emptyMessage="Nothing due today across the team."
        />
      </section>
    </>
  );
}
