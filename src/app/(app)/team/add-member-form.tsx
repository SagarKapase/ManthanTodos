"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { createMember, type CreateMemberResult } from "@/actions/users";

const inputClass = "input";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary"
    >
      {pending ? "Creating…" : "Create account"}
    </button>
  );
}

export function AddMemberForm() {
  const router = useRouter();
  const [state, formAction] = useActionState<CreateMemberResult | undefined, FormData>(
    async (prev, fd) => {
      const res = await createMember(prev, fd);
      if ("ok" in res) router.refresh();
      return res;
    },
    undefined
  );

  const created = state && "ok" in state ? state : null;

  return (
    <div className="card p-5">
      <h2 className="mb-3 text-sm font-semibold text-ink">Add a team member</h2>
      <form action={formAction} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="name" placeholder="Full name" required className={inputClass} />
          <input name="username" placeholder="Username or email" required className={inputClass} />
        </div>
        <select name="role" defaultValue="MEMBER" className={inputClass}>
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Admin</option>
        </select>
        {state && "error" in state && <p className="text-sm text-red-600">{state.error}</p>}
        <SubmitButton />
      </form>

      {created && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm">
          <p className="font-medium text-green-800">Account created for {created.name}.</p>
          <p className="mt-1 text-green-700">
            Share these credentials — they&apos;ll be asked to set a new password on first login:
          </p>
          <div className="mt-2 space-y-1 font-mono text-xs text-ink">
            <div>Username: <span className="font-semibold">{created.username}</span></div>
            <div>Temp password: <span className="font-semibold">{created.tempPassword}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
