"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";
import { cn } from "./utils";

/**
 * Tiny toast system. One pattern for "I did the thing" feedback across the
 * app — used when the visual reaction (a row appearing, a result vanishing)
 * is too subtle to be obvious, OR when the action happens off-screen.
 *
 * Each toast auto-dismisses after `duration` ms (default 3500). Multiple can
 * stack; newest at the bottom.
 */

type ToastTone = "success" | "info" | "warn";

type Toast = {
  id: string;
  message: string;
  tone: ToastTone;
  /** Optional CTA shown to the right of the message. */
  action?: { label: string; onClick: () => void };
};

type ToastContextValue = {
  show: (
    message: string,
    opts?: { tone?: ToastTone; duration?: number; action?: Toast["action"] }
  ) => void;
};

const Ctx = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback<ToastContextValue["show"]>((message, opts = {}) => {
    const id = Math.random().toString(36).slice(2, 9);
    const tone: ToastTone = opts.tone ?? "success";
    const duration = opts.duration ?? 3500;
    setToasts((t) => [...t, { id, message, tone, action: opts.action }]);
    if (duration > 0) {
      setTimeout(() => setToasts((t) => t.filter((toast) => toast.id !== id)), duration);
    }
  }, []);

  function dismiss(id: string) {
    setToasts((t) => t.filter((toast) => toast.id !== id));
  }

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      {/* Toast stack — bottom-right on desktop, bottom-center on mobile */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 z-[60] flex flex-col gap-2 items-center sm:items-end pointer-events-none"
      >
        {toasts.map((t) => {
          const styles =
            t.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950/80 dark:text-emerald-100"
              : t.tone === "warn"
              ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/80 dark:text-amber-100"
              : "border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
          const Icon = t.tone === "warn" ? AlertTriangle : CheckCircle2;
          return (
            <div
              key={t.id}
              role="status"
              className={cn(
                "pointer-events-auto inline-flex items-center gap-2 max-w-sm rounded-xl border px-3 py-2 text-sm font-medium shadow-lg backdrop-blur-sm animate-fade-in-up",
                styles
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{t.message}</span>
              {t.action && (
                <button
                  onClick={() => {
                    t.action!.onClick();
                    dismiss(t.id);
                  }}
                  className="ml-1 text-xs font-semibold underline underline-offset-2 hover:no-underline cursor-pointer"
                >
                  {t.action.label}
                </button>
              )}
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="ml-1 opacity-60 hover:opacity-100 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
