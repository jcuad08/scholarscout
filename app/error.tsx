"use client";

/**
 * App-wide error boundary. Next 14 App Router auto-mounts this when ANY
 * client-side component throws. Without it, an unhandled exception
 * blank-screens the entire site and the user sees nothing.
 *
 * Logs to console in dev so the underlying error is debuggable, but only
 * surfaces a friendly message + reset button to the user.
 */

import { useEffect } from "react";
import { GraduationCap, RefreshCw, Home as HomeIcon } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to console for dev. In production this also gets sent to
    // Vercel's runtime logs automatically.
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-400 text-white mx-auto">
          <GraduationCap className="h-7 w-7" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            ScholarScout hit an unexpected error. Your tracker data is safe — it's
            stored separately from the page state. Try again, or head back home.
          </p>
        </div>
        {error.digest && (
          <p className="text-xs text-slate-500 font-mono">Reference: {error.digest}</p>
        )}
        <div className="flex gap-2 justify-center pt-2">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-sm hover:shadow-md hover:from-brand-500 hover:to-brand-400 px-5 py-2.5 text-sm font-medium transition-all cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 px-5 py-2.5 text-sm font-medium transition-all cursor-pointer"
          >
            <HomeIcon className="h-4 w-4" />
            Home
          </a>
        </div>
      </div>
    </div>
  );
}
