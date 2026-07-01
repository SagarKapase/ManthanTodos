import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getProjectOptions } from "@/lib/workspace";
import { Sidebar } from "@/components/sidebar";
import { Toaster } from "@/components/toaster";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [projects, notificationCount] = await Promise.all([
    getProjectOptions(),
    prisma.notification.count({ where: { userId: user.id, read: false } }),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-paper md:flex-row">
      <Sidebar
        user={{ name: user.name, role: user.role }}
        projects={projects}
        notificationCount={notificationCount}
      />
      <main className="flex-1 overflow-y-auto bg-paper">
        <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-8">{children}</div>
      </main>
      <Toaster />
    </div>
  );
}
