import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { FirstLoginForm } from "./first-login-form";

export const metadata = { title: "Set your password · Manthan" };

export default async function FirstLoginPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.mustChangePassword) redirect("/today");

  return (
    <main className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="font-serif text-3xl font-semibold text-ink">Welcome, {user.name}</h1>
          <p className="mt-1.5 text-sm text-muted">Set a new password to finish signing in.</p>
        </div>
        <div className="card p-6">
          <FirstLoginForm />
        </div>
      </div>
    </main>
  );
}
