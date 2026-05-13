import Link from "next/link";
import { GraduationCap, Home as HomeIcon } from "lucide-react";

/**
 * Custom 404. Replaces Next's default plain-text "404" page so an unknown URL
 * still feels like ScholarScout instead of a server error.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-400 text-white mx-auto">
          <GraduationCap className="h-7 w-7" />
        </div>
        <div>
          <div className="font-display text-5xl font-extrabold text-slate-900 dark:text-slate-50">
            404
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold text-slate-900 dark:text-slate-50">
            Page not found
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            The page you're looking for doesn't exist. Maybe it was moved, or maybe
            you typed the URL by hand. Head home and start from the Finder.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-sm hover:shadow-md hover:from-brand-500 hover:to-brand-400 px-5 py-2.5 text-sm font-medium transition-all cursor-pointer"
        >
          <HomeIcon className="h-4 w-4" />
          Back to ScholarScout
        </Link>
      </div>
    </div>
  );
}
