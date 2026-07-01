"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { logout } from "@/actions/auth";
import { createProject } from "@/actions/projects";
import type { ProjectOption } from "@/lib/view-types";

type NavUser = { name: string; role: "ADMIN" | "MEMBER" };

const mainLinks = [
  { href: "/search", label: "Search", icon: "⌕" },
  { href: "/dashboard", label: "Dashboard", icon: "◱" },
  { href: "/today", label: "Today", icon: "★" },
  { href: "/my-tasks", label: "My Tasks", icon: "◉" },
  { href: "/upcoming", label: "Upcoming", icon: "◷" },
  { href: "/labels", label: "Filters & Labels", icon: "⚏" },
];

export function Sidebar({
  user,
  projects,
  notificationCount,
}: {
  user: NavUser;
  projects: ProjectOption[];
  notificationCount: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [, startTransition] = useTransition();

  function handleAddProject(formData: FormData) {
    startTransition(async () => {
      await createProject(formData); // redirects to the new project on success
      setAdding(false);
      router.refresh();
    });
  }

  const linkClass = (active: boolean) =>
    `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
      active
        ? "bg-clay-soft font-medium text-clay"
        : "text-muted hover:bg-ink/5 hover:text-ink"
    }`;

  const initials = user.name.trim().slice(0, 1).toUpperCase();

  const nav = (
    <nav className="flex h-full flex-col gap-1 p-3">
      <div className="mb-3 flex items-center justify-between px-2 pt-1">
        <span className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-clay text-sm font-semibold text-white shadow-sm">
            M
          </span>
          <span className="font-serif text-xl font-semibold tracking-tight text-ink">Manthan</span>
        </span>
      </div>

      {mainLinks.map((l) => (
        <Link key={l.href} href={l.href} className={linkClass(pathname === l.href)} onClick={() => setOpen(false)}>
          <span className="w-4 text-center text-faint">{l.icon}</span>
          {l.label}
        </Link>
      ))}

      <div className="mt-5 mb-1 flex items-center justify-between px-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-faint">Projects</span>
        <button
          onClick={() => setAdding((a) => !a)}
          className="grid h-5 w-5 place-items-center rounded-md text-faint transition hover:bg-ink/5 hover:text-ink"
          aria-label="Add project"
        >
          +
        </button>
      </div>

      {adding && (
        <form action={handleAddProject} className="mb-1 px-1">
          <input name="name" placeholder="Project name" autoFocus required className="field w-full" />
        </form>
      )}

      <div className="flex-1 space-y-0.5 overflow-y-auto">
        {projects.map((p) => {
          const active = pathname === `/projects/${p.id}`;
          return (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className={linkClass(active)}
              onClick={() => setOpen(false)}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: p.colour ?? "#a49d90" }}
              />
              <span className="truncate">{p.name}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-2 space-y-0.5 border-t border-line pt-2">
        <Link href="/notifications" className={linkClass(pathname === "/notifications")} onClick={() => setOpen(false)}>
          <span className="w-4 text-center text-faint">🔔</span>
          <span className="flex-1">Notifications</span>
          {notificationCount > 0 && (
            <span className="rounded-full bg-clay px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {notificationCount}
            </span>
          )}
        </Link>
        <Link href="/team" className={linkClass(pathname === "/team")} onClick={() => setOpen(false)}>
          <span className="w-4 text-center text-faint">⚑</span>
          Team
        </Link>
        <Link href="/trash" className={linkClass(pathname === "/trash")} onClick={() => setOpen(false)}>
          <span className="w-4 text-center text-faint">🗑</span>
          Trash
        </Link>
        <Link href="/settings" className={linkClass(pathname === "/settings")} onClick={() => setOpen(false)}>
          <span className="w-4 text-center text-faint">⚙</span>
          Settings
        </Link>
        <div className="mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink text-xs font-semibold text-paper">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-ink">{user.name}</div>
            <div className="text-[11px] text-faint">{user.role === "ADMIN" ? "Admin" : "Member"}</div>
          </div>
          <form action={logout}>
            <button className="text-xs text-faint transition hover:text-clay">Sign out</button>
          </form>
        </div>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-line bg-sidebar px-4 py-3 md:hidden">
        <span className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-clay text-xs font-semibold text-white">M</span>
          <span className="font-serif text-lg font-semibold text-ink">Manthan</span>
        </span>
        <button onClick={() => setOpen((o) => !o)} aria-label="Toggle menu" className="text-muted">
          ☰
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 bg-sidebar shadow-xl">{nav}</div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-line bg-sidebar md:block">{nav}</aside>
    </>
  );
}
