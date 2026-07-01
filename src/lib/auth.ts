import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { getSession } from "./session";
import type { User } from "@prisma/client";

/** Returns the current authenticated, active user, or null. */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || user.status !== "ACTIVE") return null;
  return user;
}

/** Require a logged-in user; redirect to /login otherwise. Also enforces first-login password change. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/first-login");
  return user;
}

/** Require an admin; redirect non-admins away. Admin actions are enforced server-side (PRD §6.4). */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/today");
  return user;
}
