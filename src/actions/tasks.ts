"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getInboxProject } from "@/lib/queries";

const priorities = ["P1", "P2", "P3", "P4"] as const;

function parseDueDate(value: FormDataEntryValue | null): Date | null {
  if (!value || typeof value !== "string" || value.trim() === "") return null;
  const d = new Date(`${value}T12:00:00`);
  return isNaN(d.getTime()) ? null : d;
}

function optionalId(value: FormDataEntryValue | null): string | null {
  const v = value ? String(value) : "";
  return v && v !== "none" ? v : null;
}

function labelIdsFrom(formData: FormData): string[] {
  return formData.getAll("labelIds").map(String).filter(Boolean);
}

async function notify(userId: string, actorName: string, taskId: string, title: string, verb: string) {
  await prisma.notification.create({
    data: { userId, type: "ASSIGNED", taskId, message: `${actorName} ${verb}: ${title}` },
  });
}

const createSchema = z.object({ title: z.string().trim().min(1, "A title is required").max(200) });

export async function createTask(formData: FormData) {
  const user = await requireUser();
  const parsed = createSchema.safeParse({ title: formData.get("title") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  let projectId = optionalId(formData.get("projectId"));
  if (!projectId) projectId = (await getInboxProject()).id;

  const priorityRaw = String(formData.get("priority") || "P4");
  const priority = (priorities as readonly string[]).includes(priorityRaw)
    ? (priorityRaw as (typeof priorities)[number])
    : "P4";

  const assigneeId = optionalId(formData.get("assigneeId"));
  const sectionId = optionalId(formData.get("sectionId"));
  const parentTaskId = optionalId(formData.get("parentTaskId"));
  const labelIds = labelIdsFrom(formData);

  const task = await prisma.task.create({
    data: {
      title: parsed.data.title,
      description: (formData.get("description") as string)?.trim() || null,
      projectId,
      assigneeId,
      sectionId,
      parentTaskId,
      priority,
      dueDate: parseDueDate(formData.get("dueDate")),
      createdById: user.id,
      labels: labelIds.length ? { connect: labelIds.map((id) => ({ id })) } : undefined,
    },
  });

  if (assigneeId && assigneeId !== user.id) {
    await notify(assigneeId, user.name, task.id, task.title, "assigned you");
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

const updateSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1, "A title is required").max(200),
});

export async function updateTask(formData: FormData) {
  const user = await requireUser();
  const parsed = updateSchema.safeParse({ id: formData.get("id"), title: formData.get("title") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const existing = await prisma.task.findUnique({ where: { id: parsed.data.id } });
  if (!existing) return { error: "Task not found" };

  const priorityRaw = String(formData.get("priority") || existing.priority);
  const priority = (priorities as readonly string[]).includes(priorityRaw)
    ? (priorityRaw as (typeof priorities)[number])
    : existing.priority;

  const assigneeId = optionalId(formData.get("assigneeId"));
  let projectId = optionalId(formData.get("projectId"));
  if (!projectId) projectId = existing.projectId;
  const labelIds = labelIdsFrom(formData);
  // If the project changed, drop the section (sections belong to a project).
  const sectionId = projectId === existing.projectId ? optionalId(formData.get("sectionId")) : null;

  await prisma.task.update({
    where: { id: parsed.data.id },
    data: {
      title: parsed.data.title,
      description: (formData.get("description") as string)?.trim() || null,
      projectId,
      sectionId,
      assigneeId,
      priority,
      dueDate: parseDueDate(formData.get("dueDate")),
      labels: { set: labelIds.map((id) => ({ id })) },
    },
  });

  if (assigneeId && assigneeId !== existing.assigneeId && assigneeId !== user.id) {
    await notify(assigneeId, user.name, existing.id, parsed.data.title, "assigned you");
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

// Quick sub-task add (title only) under a parent (FR-18).
export async function createSubtask(parentId: string, title: string) {
  const user = await requireUser();
  const trimmed = title.trim();
  if (!trimmed) return { error: "A title is required" };
  const parent = await prisma.task.findUnique({ where: { id: parentId } });
  if (!parent) return { error: "Parent task not found" };
  await prisma.task.create({
    data: {
      title: trimmed,
      projectId: parent.projectId,
      parentTaskId: parent.id,
      createdById: user.id,
    },
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function toggleTask(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id"));
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return;
  await prisma.task.update({
    where: { id },
    data: { status: task.status === "OPEN" ? "COMPLETED" : "OPEN" },
  });
  revalidatePath("/", "layout");
}

// Soft delete — recoverable from Trash (PRD §6.3).
export async function deleteTask(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id"));
  await prisma.task.update({ where: { id }, data: { deletedAt: new Date() } });
  revalidatePath("/", "layout");
  return { ok: true, id };
}

export async function restoreTask(id: string) {
  await requireUser();
  await prisma.task.update({ where: { id }, data: { deletedAt: null } });
  revalidatePath("/", "layout");
}

// Permanently remove (from Trash).
export async function purgeTask(id: string) {
  await requireUser();
  await prisma.task.delete({ where: { id } });
  revalidatePath("/", "layout");
}

// Board drag-and-drop: move a task to a section and reorder that column.
export async function moveTask(input: { taskId: string; sectionId: string | null; orderedIds: string[] }) {
  await requireUser();
  await prisma.task.update({
    where: { id: input.taskId },
    data: { sectionId: input.sectionId },
  });
  await prisma.$transaction(
    input.orderedIds.map((id, i) => prisma.task.update({ where: { id }, data: { sortOrder: i } }))
  );
  revalidatePath("/", "layout");
}
