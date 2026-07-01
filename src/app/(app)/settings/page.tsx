import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { ChangePasswordForm } from "./change-password-form";

export const metadata = { title: "Settings · Manthan" };

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader title="Settings" />
      <div className="space-y-6">
        <section className="card p-5">
          <h2 className="text-sm font-semibold text-ink">Account</h2>
          <dl className="mt-3 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Name</dt>
              <dd className="font-medium text-ink">{user.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Username</dt>
              <dd className="font-medium text-ink">{user.username}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Role</dt>
              <dd className="font-medium text-ink">{user.role === "ADMIN" ? "Admin" : "Member"}</dd>
            </div>
          </dl>
        </section>

        <section className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-ink">Change password</h2>
          <ChangePasswordForm />
        </section>
      </div>
    </>
  );
}
