"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { hashPassword, generateTempPassword } from "@/lib/password";

const createMemberSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  username: z.string().trim().min(3, "Username/email must be at least 3 characters").max(120),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export type CreateMemberResult =
  | { error: string }
  | { ok: true; tempPassword: string; name: string; username: string };

// Admin creates a new member with a temporary password (FR-4).
export async function createMember(
  _prev: CreateMemberResult | undefined,
  formData: FormData
): Promise<CreateMemberResult> {
  await requireAdmin();
  const parsed = createMemberSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    role: formData.get("role") || "MEMBER",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const username = parsed.data.username.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return { error: "That username/email is already taken" };

  const tempPassword = generateTempPassword();
  await prisma.user.create({
    data: {
      name: parsed.data.name,
      username,
      role: parsed.data.role,
      passwordHash: await hashPassword(tempPassword),
      mustChangePassword: true, // forces reset on first login (FR-3)
    },
  });

  revalidatePath("/team");
  return { ok: true, tempPassword, name: parsed.data.name, username };
}

// Admin resets a member's password (FR-6) — returns a new temp password.
export async function resetMemberPassword(formData: FormData): Promise<{ tempPassword?: string; error?: string }> {
  const admin = await requireAdmin();
  const id = String(formData.get("id"));
  if (id === admin.id) return { error: "Use Settings to change your own password" };

  const tempPassword = generateTempPassword();
  await prisma.user.update({
    where: { id },
    data: { passwordHash: await hashPassword(tempPassword), mustChangePassword: true },
  });
  revalidatePath("/team");
  return { tempPassword };
}

// Admin deactivates / reactivates a member (FR-7) — login blocked, data kept.
export async function toggleMemberStatus(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id"));
  if (id === admin.id) return { error: "You cannot deactivate your own account" };

  const member = await prisma.user.findUnique({ where: { id } });
  if (!member) return { error: "Member not found" };
  await prisma.user.update({
    where: { id },
    data: { status: member.status === "ACTIVE" ? "DEACTIVATED" : "ACTIVE" },
  });
  revalidatePath("/team");
}
