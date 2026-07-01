"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, destroySession, getSession } from "@/lib/session";
import { getCurrentUser } from "@/lib/auth";

export type ActionState = { error?: string } | undefined;

const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const user = await prisma.user.findUnique({
    where: { username: parsed.data.username.toLowerCase() },
  });

  // Generic message to avoid leaking which usernames exist.
  const invalid = { error: "Invalid username or password" };
  if (!user) return invalid;
  if (user.status !== "ACTIVE") return { error: "This account has been deactivated" };

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) return invalid;

  await createSession({ userId: user.id, role: user.role });

  if (user.mustChangePassword) redirect("/first-login");
  redirect("/today");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters");

// First-login forced password change (FR-3).
export async function setFirstPassword(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const newPassword = formData.get("newPassword");
  const confirm = formData.get("confirmPassword");
  const parsed = passwordSchema.safeParse(newPassword);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (newPassword !== confirm) return { error: "Passwords do not match" };

  await prisma.user.update({
    where: { id: session.userId },
    data: { passwordHash: await hashPassword(parsed.data), mustChangePassword: false },
  });
  redirect("/today");
}

// Change own password from settings (FR-5).
export async function changePassword(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const current = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword");
  const confirm = formData.get("confirmPassword");

  const ok = await verifyPassword(current ?? "", user.passwordHash);
  if (!ok) return { error: "Current password is incorrect" };

  const parsed = passwordSchema.safeParse(newPassword);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (newPassword !== confirm) return { error: "Passwords do not match" };

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data), mustChangePassword: false },
  });
  return { error: undefined };
}
