"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

const nameSchema = z.string().trim().min(1, "Section name is required").max(60);

export async function createSection(formData: FormData) {
  await requireUser();
  const projectId = String(formData.get("projectId"));
  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const count = await prisma.section.count({ where: { projectId } });
  await prisma.section.create({ data: { name: parsed.data, projectId, order: count } });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function renameSection(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id"));
  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await prisma.section.update({ where: { id }, data: { name: parsed.data } });
  revalidatePath("/", "layout");
}

// Deleting a section keeps its tasks (they fall back to "No section").
export async function deleteSection(id: string) {
  await requireUser();
  await prisma.section.delete({ where: { id } });
  revalidatePath("/", "layout");
}
