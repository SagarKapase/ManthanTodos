"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

const schema = z.object({
  taskId: z.string().min(1),
  body: z.string().trim().min(1, "Write something first").max(2000),
});

// Add a comment / note to a task (FR-19).
export async function addComment(formData: FormData) {
  const user = await requireUser();
  const parsed = schema.safeParse({ taskId: formData.get("taskId"), body: formData.get("body") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const task = await prisma.task.findUnique({ where: { id: parsed.data.taskId } });
  if (!task) return { error: "Task not found" };

  await prisma.comment.create({
    data: { taskId: parsed.data.taskId, authorId: user.id, body: parsed.data.body },
  });

  // Notify the assignee and creator (if it isn't the commenter).
  const recipients = new Set<string>();
  if (task.assigneeId && task.assigneeId !== user.id) recipients.add(task.assigneeId);
  if (task.createdById !== user.id) recipients.add(task.createdById);
  for (const userId of recipients) {
    await prisma.notification.create({
      data: { userId, type: "COMMENT", taskId: task.id, message: `${user.name} commented on: ${task.title}` },
    });
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteComment(id: string) {
  const user = await requireUser();
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment || comment.authorId !== user.id) return { error: "You can only delete your own comments" };
  await prisma.comment.delete({ where: { id } });
  revalidatePath("/", "layout");
}
