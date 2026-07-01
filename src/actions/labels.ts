"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

const schema = z.object({
  name: z.string().trim().min(1, "Label name is required").max(40),
  colour: z.string().trim().optional(),
});

export async function createLabel(formData: FormData) {
  await requireUser();
  const parsed = schema.safeParse({
    name: formData.get("name"),
    colour: formData.get("colour") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const existing = await prisma.label.findUnique({ where: { name: parsed.data.name } });
  if (existing) return { error: "A label with that name already exists" };

  await prisma.label.create({ data: { name: parsed.data.name, colour: parsed.data.colour ?? null } });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function renameLabel(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id"));
  const parsed = schema.safeParse({
    name: formData.get("name"),
    colour: formData.get("colour") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await prisma.label.update({
    where: { id },
    data: { name: parsed.data.name, colour: parsed.data.colour ?? null },
  });
  revalidatePath("/", "layout");
}

export async function deleteLabel(id: string) {
  await requireUser();
  await prisma.label.delete({ where: { id } });
  revalidatePath("/", "layout");
}
