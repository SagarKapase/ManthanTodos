"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { taskInclude } from "@/lib/queries";
import { toTaskView, type TaskDetail } from "@/lib/view-types";

// Load the full detail for a task (fields + sub-tasks + comments + its project's sections).
export async function getTaskDetail(id: string): Promise<TaskDetail | null> {
  const user = await requireUser();
  const task = await prisma.task.findFirst({
    where: { id, deletedAt: null },
    include: {
      ...taskInclude,
      subTasks: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
      comments: {
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!task) return null;

  const sections = await prisma.section.findMany({
    where: { projectId: task.projectId },
    orderBy: { order: "asc" },
    select: { id: true, name: true },
  });

  return {
    ...toTaskView(task),
    createdAt: task.createdAt.toISOString(),
    sections,
    subTasks: task.subTasks.map((s) => ({ id: s.id, title: s.title, status: s.status })),
    comments: task.comments.map((c) => ({
      id: c.id,
      body: c.body,
      authorName: c.author.name,
      createdAt: c.createdAt.toISOString(),
      mine: c.authorId === user.id,
    })),
  };
}
