import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { LabelsManager } from "@/components/labels-manager";

export const metadata = { title: "Labels · Manthan" };

export default async function LabelsPage() {
  await requireUser();
  const labels = await prisma.label.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { tasks: true } } },
  });

  return (
    <>
      <PageHeader title="Filters & Labels" subtitle="Tag tasks and slice your work by label">
        <Link href="/filters" className="rounded-xl border border-line bg-surface px-3 py-1.5 text-sm text-muted transition hover:bg-ink/5">
          Filter builder →
        </Link>
      </PageHeader>
      <LabelsManager
        labels={labels.map((l) => ({ id: l.id, name: l.name, colour: l.colour, count: l._count.tasks }))}
      />
    </>
  );
}
