// Plain serializable shapes passed from server components to client components.

export type MemberOption = { id: string; name: string };
export type ProjectOption = { id: string; name: string; colour: string | null; isInbox: boolean };
export type LabelView = { id: string; name: string; colour: string | null };
export type SectionOption = { id: string; name: string };
export type CommentView = { id: string; body: string; authorName: string; createdAt: string; mine: boolean };
export type SubTaskView = { id: string; title: string; status: "OPEN" | "COMPLETED" };

export type TaskView = {
  id: string;
  title: string;
  description: string | null;
  status: "OPEN" | "COMPLETED";
  priority: "P1" | "P2" | "P3" | "P4";
  dueDate: string | null;
  projectId: string;
  projectName: string;
  projectColour: string | null;
  sectionId: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  createdByName: string;
  labels: LabelView[];
  subTaskCount: number;
  commentCount: number;
};

export type TaskDetail = TaskView & {
  sections: SectionOption[];
  subTasks: SubTaskView[];
  comments: CommentView[];
  createdAt: string;
};

import type { TaskWithRelations } from "./queries";

export function toTaskView(t: TaskWithRelations): TaskView {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    projectId: t.projectId,
    projectName: t.project.name,
    projectColour: t.project.colour,
    sectionId: t.sectionId,
    assigneeId: t.assigneeId,
    assigneeName: t.assignee?.name ?? null,
    createdByName: t.createdBy.name,
    labels: t.labels.map((l) => ({ id: l.id, name: l.name, colour: l.colour })),
    subTaskCount: t._count.subTasks,
    commentCount: t._count.comments,
  };
}
