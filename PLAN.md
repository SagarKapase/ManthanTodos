# Manthan — Build Plan

> A shared task & to-do workspace for small teams (Todoist-style, single-team, credential-based onboarding).
> Derived from `Manthan_PRD.docx` v1.0. This file is the working implementation plan.

## 1. Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Next.js 15 (App Router) + TypeScript** | Full-stack in one repo; server + client; meets SPA-like UX |
| Styling | **Tailwind CSS** | Fast, clean, consistent UI (NFR usability) |
| Database | **SQLite via Prisma** (dev) → Postgres-ready | Zero-config local dev; schema maps 1:1 to PRD data model; swap to Postgres for prod |
| ORM | **Prisma** | Type-safe models matching PRD §7 |
| Auth | **JWT session in httpOnly cookie** (`jose`) + **bcryptjs** hashing | Server-enforced role checks (NFR security §6.4) |
| Validation | **Zod** | Shared request validation |
| State/UX | Server Actions + optimistic UI | "Instant" feel (NFR performance §6.2) |

**Security principles (PRD §8.2):** passwords hashed+salted, HTTPS in prod, every request authorized server-side against role, admin actions enforced on server not just hidden.

## 2. Data Model (PRD §7)

- **User**: id, name, username/email (unique), passwordHash, role (`ADMIN`/`MEMBER`), status (`ACTIVE`/`DEACTIVATED`), mustChangePassword (first-login flow), createdAt
- **Project**: id, name, colour, status (`ACTIVE`/`ARCHIVED`), createdById, createdAt. A seeded **Inbox** project is the default.
- **Task**: id, title, description, projectId (default Inbox), assigneeId (nullable), createdById, dueDate, priority (`P1`–`P4`, default P4), status (`OPEN`/`COMPLETED`), parentTaskId (sub-tasks), createdAt, updatedAt
- **Label**: id, name, colour — many-to-many with Task
- **Comment**: id, taskId, authorId, body, createdAt
- **Notification**: id, userId, type, taskId, read, createdAt

## 3. Phased Delivery (maps to PRD §9)

### Phase 1 — MVP (Must-have) ← BUILDING NOW
- [ ] Prisma schema + SQLite + seed (admin user + Inbox project)
- [ ] Auth: login / logout (FR-1, FR-2), JWT cookie sessions
- [ ] First-login forced password change (FR-3)
- [ ] Admin creates member accounts with temp password (FR-4)
- [ ] Change own password in settings (FR-5)
- [ ] Middleware: protect routes, server-side role checks
- [ ] Tasks: quick-add title (FR-10); description/due/priority/project (FR-11); assign (FR-12); complete/reopen (FR-13); edit (FR-14); delete w/ confirm (FR-15); priority P1–P4 (FR-16)
- [ ] Projects: create/rename/delete (FR-22); default Inbox (FR-23); view tasks in project (FR-24)
- [ ] Shared workspace — all members see all tasks/projects (FR-35, FR-36)
- [ ] Views: Today (FR-28), My Tasks (FR-29), Upcoming (FR-30)
- [ ] Responsive layout (mobile browser usable)

### Phase 2 — Collaboration & polish (Should-have)
- [ ] Labels/tags (FR-17), sub-tasks (FR-18), comments (FR-19)
- [ ] Filter by assignee/project/priority/label (FR-31); keyword search (FR-32); Overdue grouping (FR-33)
- [ ] In-app assignment notifications (FR-38); team directory (FR-37)
- [ ] Admin: reset password (FR-6), deactivate member (FR-7); session expiry (FR-8)
- [ ] Dashboard with counts (FR-41, FR-42); project colours (FR-25) + archive (FR-26)

### Phase 3 — Nice-to-have
- [ ] Kanban board (FR-34), drag-drop reorder (FR-27)
- [ ] Recurring tasks (FR-21), attachments (FR-20)
- [ ] Email notifications (FR-40), forgot-password (FR-9), workload view (FR-43)

## 4. App Structure

```
src/
  app/
    (auth)/login/            # login page
    first-login/             # forced password change
    (app)/                   # authenticated shell (sidebar + views)
      today/  my-tasks/  upcoming/
      projects/[id]/
      team/                  # admin: members
      settings/              # change password
    api/                     # route handlers where needed
  lib/
    db.ts        # Prisma client
    auth.ts      # session (jose), getCurrentUser, requireAdmin
    password.ts  # bcrypt helpers
  components/    # TaskItem, TaskForm, Sidebar, etc.
  actions/       # server actions: tasks, projects, users, auth
prisma/
  schema.prisma
  seed.ts
```

## 5. Key Flows (PRD §5)
1. **Admin onboards member** → Team → Add member → temp password → member forced to reset on first login.
2. **Create & complete task** → quick-add → appears in views → tick complete.
3. **Assign work** → set assignee → notification → shows in their My Tasks.
4. **Start the day** → land on Today view → review due/overdue.

## 6. Seed / Demo Credentials
- Admin: `admin@manthan.app` / `admin123` (mustChangePassword = false for demo convenience)
- Default project: **Inbox**

## 7. Progress Log
- Read PRD, chose stack, scaffolded Next.js, wrote this plan.
- ✅ **Phase 1 MVP complete** — Prisma schema + migration + seed; JWT/bcrypt auth with first-login password change; admin member management (create/reset/deactivate); full task CRUD with assignee/priority/due/project; projects with Inbox + colours + archive; Dashboard, Today, My Tasks, Upcoming, and per-project views; responsive sidebar shell; in-app assignment notifications.
- ✅ Verified: `tsc --noEmit` clean, `next build` passes (12 routes), dev server serves all authenticated views (200) with real data rendering.
- ✅ **UI redesign (Anthropic house style)** — warm paper canvas (`#f4f1ea`), clay/terracotta accent (`#c15f3c`), Fraunces serif for display + Inter for UI; centralized design tokens in `@theme` + reusable `.card`/`.input`/`.btn-primary` component classes. Fixed a Chrome auto-dark-mode bug (black-on-black) by declaring `color-scheme: light` and giving all surfaces explicit backgrounds.
- ✅ **Phase 2 + Todoist-parity (complete)**:
  - **Task depth** — sub-tasks (FR-18), comments (FR-19), and labels (FR-17) via a full **task detail modal** (edit every field, sub-task list, comment thread, creator/timestamps).
  - **Board view** (FR-34) — custom **sections** per project + List/Board toggle + HTML5 drag-and-drop to move/reorder cards; section CRUD.
  - **Find & organize** — keyword **search** (FR-32), **filters** by assignee/project/priority/label/status (FR-31), **Filters & Labels** hub, and a **notifications inbox** (FR-38) with mark-read + live badge.
  - **Hardening** — **soft-delete + Trash + undo toast** (recoverable, PRD §6.3), **idle-session** sliding expiry via `proxy.ts` (FR-8), **member-visible team directory** (FR-37, admin actions still server-gated).
  - Data model: added `Section`, `Task.sectionId`, `Task.deletedAt`; sub-tasks excluded from top-level lists.
- **Remaining (Phase 3, Could-haves)**: recurring tasks (FR-21), attachments (FR-20), email notifications (FR-40), forgot-password (FR-9), per-member workload (FR-43), activity feed (FR-39).
