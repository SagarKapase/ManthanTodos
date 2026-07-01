import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLabelOptions, getMemberOptions, getProjectOptions } from "@/lib/workspace";
import { PageHeader } from "@/components/page-header";
import { NotificationsList } from "@/components/notifications-list";

export const metadata = { title: "Notifications · Manthan" };

export default async function NotificationsPage() {
  const user = await requireUser();
  const [items, projects, members, labels] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    getProjectOptions(),
    getMemberOptions(),
    getLabelOptions(),
  ]);

  return (
    <>
      <PageHeader title="Notifications" subtitle="Assignments and comments on your tasks" />
      <NotificationsList
        items={items.map((n) => ({
          id: n.id,
          message: n.message,
          taskId: n.taskId,
          read: n.read,
          createdAt: n.createdAt.toISOString(),
        }))}
        projects={projects}
        members={members}
        labels={labels}
      />
    </>
  );
}
