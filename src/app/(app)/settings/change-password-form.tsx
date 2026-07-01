"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { changePassword, type ActionState } from "@/actions/auth";

const inputClass = "input";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary"
    >
      {pending ? "Updating…" : "Update password"}
    </button>
  );
}

export function ChangePasswordForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(changePassword, undefined);
  const success = state !== undefined && !state.error;

  return (
    <form action={formAction} className="max-w-sm space-y-3">
      <input name="currentPassword" type="password" placeholder="Current password" autoComplete="current-password" required className={inputClass} />
      <input name="newPassword" type="password" placeholder="New password (min 8 chars)" autoComplete="new-password" required className={inputClass} />
      <input name="confirmPassword" type="password" placeholder="Confirm new password" autoComplete="new-password" required className={inputClass} />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {success && <p className="text-sm text-green-600">Password updated.</p>}
      <SubmitButton />
    </form>
  );
}
