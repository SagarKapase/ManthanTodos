// Client-safe helpers (no server-only imports).

export const PRIORITY_META: Record<string, { label: string; dot: string; text: string }> = {
  P1: { label: "P1 · Urgent", dot: "bg-red-500", text: "text-red-600" },
  P2: { label: "P2 · High", dot: "bg-amber-500", text: "text-amber-600" },
  P3: { label: "P3 · Medium", dot: "bg-indigo-400", text: "text-indigo-500" },
  P4: { label: "P4 · Normal", dot: "bg-stone-400", text: "text-stone-500" },
};

export function formatDueDate(due: string | Date | null): { label: string; overdue: boolean } | null {
  if (!due) return null;
  const d = new Date(due);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const diffDays = Math.round((day.getTime() - today.getTime()) / 86_400_000);

  let label: string;
  if (diffDays === 0) label = "Today";
  else if (diffDays === 1) label = "Tomorrow";
  else if (diffDays === -1) label = "Yesterday";
  else if (diffDays > 1 && diffDays <= 6)
    label = d.toLocaleDateString(undefined, { weekday: "long" });
  else label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return { label, overdue: diffDays < 0 };
}

export function toDateInputValue(due: string | Date | null): string {
  if (!due) return "";
  const d = new Date(due);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60_000);
  return local.toISOString().slice(0, 10);
}
