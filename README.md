# Manthan

A shared task & to-do workspace for small teams — Todoist-style, single-team, credential-based onboarding.
Built from `Manthan_PRD.docx` v1.0. See **[PLAN.md](./PLAN.md)** for the full build plan and PRD → feature mapping.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS
- **Prisma 6** + SQLite (Postgres-ready)
- **Auth**: JWT session in an httpOnly cookie (`jose`) + `bcryptjs` hashing, server-enforced role checks
- Server Actions for all mutations

## Getting started

```bash
npm install
npx prisma migrate dev      # create the SQLite DB + tables
npm run db:seed             # seed admin + Inbox + sample projects
npm run dev                 # http://localhost:3000
```

### Demo login

| Field | Value |
|-------|-------|
| Username | `admin@manthan.app` |
| Password | `admin123` |

The admin can create members under **Team**; each new member gets a temporary password and is forced to set their own on first login.

## What's implemented (Phase 1 MVP)

- **Auth**: login/logout, JWT sessions, first-login forced password change, change own password
- **Admin**: create member accounts (temp password), reset password, deactivate/reactivate members
- **Tasks**: quick-add, description/due date/priority (P1–P4)/project/assignee, complete/re-open, edit, delete (with confirm)
- **Projects**: create/rename/delete, colours, archive; default **Inbox**
- **Views**: Dashboard (counts), Today (+ overdue), My Tasks, Upcoming (grouped by day), per-project
- **Shared workspace**: everyone sees all tasks/projects; in-app assignment notifications; responsive (mobile drawer)

## Phase 2 + Todoist parity

- **Task detail modal** — click any task to edit every field, manage **sub-tasks**, and post **comments**
- **Labels** — create/colour labels, tag tasks, and browse via **Filters & Labels**
- **Board view** — per-project **sections** with **drag-and-drop** (List/Board toggle)
- **Search** and **Filters** (assignee / project / priority / label / status)
- **Notifications inbox** with mark-as-read and a live sidebar badge
- **Trash** — soft-delete with an **undo** toast, restore, or delete forever
- **Idle sessions** — sliding expiry via `src/proxy.ts`; **team directory** visible to all members

See `PLAN.md` for the full roadmap (Phase 3 nice-to-haves remain).

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run db:seed` | Seed the database |
| `npm run db:reset` | Reset DB + re-run migrations |

## Data model

`User`, `Project`, `Task` (with sub-tasks), `Label`, `Comment`, `Notification` — see `prisma/schema.prisma`, mapped from PRD §7.
# ManthanTodos
