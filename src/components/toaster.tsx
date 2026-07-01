"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { restoreTask } from "@/actions/tasks";

type Toast = { id: number; message: string; undoTaskId?: string };

const EVENT = "manthan:toast";

export function showToast(detail: { message: string; undoTaskId?: string }) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVENT, { detail }));
}

let counter = 0;

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    function onToast(e: Event) {
      const detail = (e as CustomEvent).detail as { message: string; undoTaskId?: string };
      const id = ++counter;
      setToasts((t) => [...t, { id, ...detail }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 6000);
    }
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  function dismiss(id: number) {
    setToasts((t) => t.filter((x) => x.id !== id));
  }

  function undo(t: Toast) {
    if (t.undoTaskId) {
      startTransition(async () => {
        await restoreTask(t.undoTaskId!);
        router.refresh();
      });
    }
    dismiss(t.id);
  }

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-4 rounded-xl bg-ink px-4 py-2.5 text-sm text-paper shadow-lg"
        >
          <span>{t.message}</span>
          {t.undoTaskId && (
            <button onClick={() => undo(t)} className="font-medium text-clay-soft hover:text-white">
              Undo
            </button>
          )}
          <button onClick={() => dismiss(t.id)} className="text-paper/50 hover:text-paper" aria-label="Dismiss">
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
