import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { TrashList } from "@/components/trash-list";

export const metadata = { title: "Trash · Manthan" };

export default async function TrashPage() {
  await requireUser();
  const tasks = await prisma.task.findMany({
    where: { deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
    include: { project: { select: { name: true, colour: true } } },
    take: 100,
  });

  return (
    <>
      <PageHeader title="Trash" subtitle="Deleted tasks — restore them or clear for good" />
      <TrashList
        tasks={tasks.map((t) => ({
          id: t.id,
          title: t.title,
          projectName: t.project.name,
          projectColour: t.project.colour,
          deletedAt: t.deletedAt!.toISOString(),
        }))}
      />
    </>
  );
}
