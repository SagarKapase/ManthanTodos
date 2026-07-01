"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

const projectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required").max(60),
  colour: z.string().trim().optional(),
});

export async function createProject(formData: FormData) {
  await requireUser();
  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    colour: formData.get("colour") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const project = await prisma.project.create({
    data: { name: parsed.data.name, colour: parsed.data.colour ?? null },
  });
  revalidatePath("/", "layout");
  redirect(`/projects/${project.id}`);
}

export async function renameProject(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id"));
  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    colour: formData.get("colour") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.project.update({
    where: { id },
    data: { name: parsed.data.name, colour: parsed.data.colour ?? null },
  });
  revalidatePath("/", "layout");
}

export async function archiveProject(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id"));
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.isInbox) return { error: "This project cannot be archived" };
  await prisma.project.update({
    where: { id },
    data: { status: project.status === "ARCHIVED" ? "ACTIVE" : "ARCHIVED" },
  });
  revalidatePath("/", "layout");
}

export async function deleteProject(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id"));
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.isInbox) return { error: "The Inbox project cannot be deleted" };
  await prisma.project.delete({ where: { id } }); // cascades to its tasks
  revalidatePath("/", "layout");
  redirect("/today");
}
