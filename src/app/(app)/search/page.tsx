import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { taskInclude, notDeleted } from "@/lib/queries";
import { getLabelOptions, getMemberOptions, getProjectOptions } from "@/lib/workspace";
import { toTaskView } from "@/lib/view-types";
import { PageHeader } from "@/components/page-header";
import { TaskList, SectionHeader } from "@/components/task-list";

export const metadata = { title: "Search · Manthan" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireUser();
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const [projects, members, labels] = await Promise.all([
    getProjectOptions(),
    getMemberOptions(),
    getLabelOptions(),
  ]);

  const results = query
    ? (
        await prisma.task.findMany({
          where: {
            ...notDeleted,
            OR: [{ title: { contains: query } }, { description: { contains: query } }],
          },
          include: taskInclude,
          orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
          take: 100,
        })
      ).map(toTaskView)
    : [];

  return (
    <>
      <PageHeader title="Search" subtitle="Find any task by keyword" />
      <form method="get" className="card mb-5 flex items-center gap-2 p-2.5">
        <span className="pl-1 text-faint">🔍</span>
        <input
          name="q"
          defaultValue={query}
          autoFocus
          placeholder="Search tasks…"
          className="flex-1 bg-transparent text-sm text-ink placeholder:text-faint outline-none"
        />
        <button type="submit" className="btn-primary px-4 py-1.5">Search</button>
      </form>

      {query && (
        <section>
          <SectionHeader title={`Results for “${query}”`} count={results.length} />
          <TaskList
            tasks={results}
            projects={projects}
            members={members}
            labels={labels}
            emptyMessage="No tasks match that search."
          />
        </section>
      )}
    </>
  );
}
