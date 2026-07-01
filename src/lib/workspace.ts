import "server-only";
import { prisma } from "./db";
import type { LabelView, MemberOption, ProjectOption } from "./view-types";

/** Active projects for the sidebar / task forms (Inbox first, then alphabetical). */
export async function getProjectOptions(): Promise<ProjectOption[]> {
  const projects = await prisma.project.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ isInbox: "desc" }, { name: "asc" }],
    select: { id: true, name: true, colour: true, isInbox: true },
  });
  return projects;
}

/** Active members for assignee dropdowns. */
export async function getMemberOptions(): Promise<MemberOption[]> {
  return prisma.user.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

/** All labels for tagging / filtering. */
export async function getLabelOptions(): Promise<LabelView[]> {
  return prisma.label.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, colour: true },
  });
}
