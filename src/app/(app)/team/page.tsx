import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { AddMemberForm } from "./add-member-form";
import { MemberActions } from "./member-actions";

export const metadata = { title: "Team · Manthan" };

export default async function TeamPage() {
  const me = await requireUser();
  const isAdmin = me.role === "ADMIN";
  const members = await prisma.user.findMany({
    orderBy: [{ status: "asc" }, { name: "asc" }],
    include: { _count: { select: { assignedTasks: true } } },
  });

  return (
    <>
      <PageHeader
        title="Team"
        subtitle={isAdmin ? "Manage member accounts and access" : "Everyone on the team"}
      />
      <div className="space-y-6">
        {isAdmin && <AddMemberForm />}

        <section className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-faint">
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {isAdmin && <th className="px-4 py-3 text-right font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-line/60 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-clay-soft text-xs font-semibold text-clay">
                        {m.name.trim().slice(0, 1).toUpperCase()}
                      </span>
                      <div>
                        <div className="font-medium text-ink">{m.name}</div>
                        <div className="text-xs text-faint">{m.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{m.role === "ADMIN" ? "Admin" : "Member"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        m.status === "ACTIVE"
                          ? "bg-green-50 text-green-700"
                          : "bg-ink/5 text-muted"
                      }`}
                    >
                      {m.status === "ACTIVE" ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <MemberActions member={m} isSelf={m.id === me.id} />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}
