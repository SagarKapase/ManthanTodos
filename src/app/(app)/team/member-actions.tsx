"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetMemberPassword, toggleMemberStatus } from "@/actions/users";

export function MemberActions({
  member,
  isSelf,
}: {
  member: { id: string; name: string; status: string };
  isSelf: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const deactivated = member.status === "DEACTIVATED";

  if (isSelf) return <span className="text-xs text-faint">You</span>;

  function onReset() {
    if (!confirm(`Reset ${member.name}'s password?`)) return;
    const fd = new FormData();
    fd.set("id", member.id);
    startTransition(async () => {
      const res = await resetMemberPassword(fd);
      if (res.tempPassword) setTempPassword(res.tempPassword);
      router.refresh();
    });
  }

  function onToggle() {
    const verb = deactivated ? "Reactivate" : "Deactivate";
    if (!confirm(`${verb} ${member.name}?`)) return;
    const fd = new FormData();
    fd.set("id", member.id);
    startTransition(async () => {
      await toggleMemberStatus(fd);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      {tempPassword && (
        <span className="rounded bg-amber-50 px-2 py-1 font-mono text-xs text-amber-800">
          {tempPassword}
        </span>
      )}
      <button
        onClick={onReset}
        disabled={pending}
        className="text-xs text-muted transition hover:text-ink disabled:opacity-50"
      >
        Reset password
      </button>
      <button
        onClick={onToggle}
        disabled={pending}
        className={`text-xs disabled:opacity-50 ${
          deactivated ? "text-green-600 hover:text-green-700" : "text-red-500 hover:text-red-600"
        }`}
      >
        {deactivated ? "Reactivate" : "Deactivate"}
      </button>
    </div>
  );
}
