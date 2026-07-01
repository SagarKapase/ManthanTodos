import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in · Manthan" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/today");

  return (
    <main className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-clay text-xl font-semibold text-white shadow-sm">
            M
          </div>
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-ink">Manthan</h1>
          <p className="mt-1.5 text-sm text-muted">Your team&apos;s shared task workspace</p>
        </div>
        <div className="card p-6">
          <LoginForm />
        </div>
        <p className="mt-4 text-center text-xs text-faint">
          Access is by issued credentials. Ask your admin to create an account.
        </p>
      </div>
    </main>
  );
}
