import "server-only";
import { prisma } from "./db";
import type { Prisma } from "@prisma/client";

// Shared "task with relations" shape used across views.
export const taskInclude = {
  project: true,
  section: { select: { id: true, name: true } },
  assignee: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  labels: true,
  _count: { select: { subTasks: true, comments: true } },
} satisfies Prisma.TaskInclude;

export type TaskWithRelations = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;

// Top-level list filter: exclude soft-deleted tasks (PRD §6.3) and sub-tasks
// (sub-tasks live inside their parent's detail, not in the main lists/board).
export const notDeleted = { deletedAt: null, parentTaskId: null } satisfies Prisma.TaskWhereInput;

/** Inbox is the default project every stray task falls into (FR-23). */
export async function getInboxProject() {
  const inbox = await prisma.project.findFirst({ where: { isInbox: true } });
  if (inbox) return inbox;
  return prisma.project.create({ data: { name: "Inbox", isInbox: true, colour: "#64748b" } });
}

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}
