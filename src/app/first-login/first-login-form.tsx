"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { setFirstPassword, type ActionState } from "@/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary w-full py-2.5"
    >
      {pending ? "Saving…" : "Set password & continue"}
    </button>
  );
}

const inputClass = "input";

export function FirstLoginForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(setFirstPassword, undefined);
  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="newPassword" className="mb-1 block text-sm font-medium text-ink">
          New password
        </label>
        <input id="newPassword" name="newPassword" type="password" autoComplete="new-password" required autoFocus className={inputClass} />
      </div>
      <div>
        <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-ink">
          Confirm password
        </label>
        <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required className={inputClass} />
      </div>
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}
      <SubmitButton />
    </form>
  );
}
