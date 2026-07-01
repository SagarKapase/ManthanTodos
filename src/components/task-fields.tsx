"use client";

import type { LabelView, MemberOption, ProjectOption, SectionOption } from "@/lib/view-types";

const labelClass = "flex flex-col gap-1 text-[11px] font-medium uppercase tracking-wide text-faint";

/** Shared task detail fields, used by quick-add, the board composer, and the detail modal. */
export function TaskFields({
  projects,
  members,
  labels = [],
  sections,
  defaults,
}: {
  projects: ProjectOption[];
  members: MemberOption[];
  labels?: LabelView[];
  sections?: SectionOption[];
  defaults?: {
    projectId?: string;
    priority?: string;
    dueDate?: string;
    assigneeId?: string | null;
    description?: string | null;
    labelIds?: string[];
    sectionId?: string | null;
  };
}) {
  const selected = new Set(defaults?.labelIds ?? []);

  return (
    <>
      <textarea
        name="description"
        placeholder="Add a description…"
        defaultValue={defaults?.description ?? ""}
        rows={2}
        className="input resize-none"
      />
      <div className="flex flex-wrap gap-2.5">
        <label className={labelClass}>
          Project
          <select name="projectId" defaultValue={defaults?.projectId ?? ""} className="field">
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        {sections && sections.length > 0 && (
          <label className={labelClass}>
            Section
            <select name="sectionId" defaultValue={defaults?.sectionId ?? "none"} className="field">
              <option value="none">No section</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className={labelClass}>
          Priority
          <select name="priority" defaultValue={defaults?.priority ?? "P4"} className="field">
            <option value="P1">P1 · Urgent</option>
            <option value="P2">P2 · High</option>
            <option value="P3">P3 · Medium</option>
            <option value="P4">P4 · Normal</option>
          </select>
        </label>
        <label className={labelClass}>
          Due date
          <input type="date" name="dueDate" defaultValue={defaults?.dueDate ?? ""} className="field" />
        </label>
        <label className={labelClass}>
          Assignee
          <select name="assigneeId" defaultValue={defaults?.assigneeId ?? "none"} className="field">
            <option value="none">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {labels.length > 0 && (
        <div>
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-faint">Labels</span>
          <div className="flex flex-wrap gap-1.5">
            {labels.map((l) => (
              <label
                key={l.id}
                className="group relative cursor-pointer"
                style={{ ["--dot" as string]: l.colour ?? "#a49d90" }}
              >
                <input
                  type="checkbox"
                  name="labelIds"
                  value={l.id}
                  defaultChecked={selected.has(l.id)}
                  className="peer sr-only"
                />
                <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-xs text-muted transition peer-checked:border-clay peer-checked:bg-clay-soft peer-checked:text-clay">
                  <span className="h-2 w-2 rounded-full" style={{ background: l.colour ?? "#a49d90" }} />
                  {l.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
