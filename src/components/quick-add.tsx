"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTask } from "@/actions/tasks";
import { TaskFields } from "./task-fields";
import type { LabelView, MemberOption, ProjectOption, SectionOption } from "@/lib/view-types";

export function QuickAdd({
  projects,
  members,
  labels = [],
  sections,
  defaultProjectId,
  defaultAssigneeId,
  defaultDueDate,
  defaultSectionId,
  placeholder = "Add a task…",
}: {
  projects: ProjectOption[];
  members: MemberOption[];
  labels?: LabelView[];
  sections?: SectionOption[];
  defaultProjectId?: string;
  defaultAssigneeId?: string | null;
  defaultDueDate?: string;
  defaultSectionId?: string | null;
  placeholder?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createTask(formData);
      if (res?.error) {
        setError(res.error);
        return;
      }
      formRef.current?.reset();
      setExpanded(false);
      router.refresh();
    });
  }

  return (
    <form ref={formRef} action={onSubmit} className="card p-3.5">
      <div className="flex items-center gap-2.5">
        <span className="grid h-5 w-5 place-items-center rounded-full text-clay">+</span>
        <input
          name="title"
          placeholder={placeholder}
          required
          onFocus={() => setExpanded(true)}
          className="flex-1 bg-transparent text-sm text-ink placeholder:text-faint outline-none"
        />
        <button type="submit" disabled={pending} className="btn-primary px-3.5 py-1.5">
          {pending ? "Adding…" : "Add"}
        </button>
      </div>

      {expanded && (
        <div className="mt-3.5 space-y-3 border-t border-line pt-3.5">
          <TaskFields
            projects={projects}
            members={members}
            labels={labels}
            sections={sections}
            defaults={{
              projectId: defaultProjectId ?? projects.find((p) => p.isInbox)?.id ?? projects[0]?.id,
              assigneeId: defaultAssigneeId ?? "none",
              dueDate: defaultDueDate,
              sectionId: defaultSectionId ?? "none",
            }}
          />
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-xs text-faint transition hover:text-muted"
          >
            Hide details
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </form>
  );
}
