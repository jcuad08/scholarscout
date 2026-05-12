"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "./ui";
import { AuthModal } from "./auth-modal";
import { Cloud, LogIn, LogOut, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Header-mounted auth control. Renders nothing until the auth context is
 * `ready` to avoid the "logged-out flash" on every page load (server renders
 * Sign-in, client restores session, swap looks like a flicker).
 *
 * - Auth not configured → render nothing (local-only mode).
 * - Logged out → "Sign in" button that opens the modal.
 * - Logged in → avatar + dropdown with email + Sign out.
 */
export function AuthMenu() {
  const { ready, authAvailable, user, signOut } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the user menu on outside click.
  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  if (!authAvailable) return null;
  if (!ready) {
    // Reserve roughly the same width as the eventual button so layout
    // doesn't jump when auth state resolves.
    return <div className="w-20 h-9" aria-hidden />;
  }

  if (!user) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setModalOpen(true)}
          className="hidden sm:inline-flex"
        >
          <LogIn className="h-3.5 w-3.5" />
          Sign in
        </Button>
        <button
          aria-label="Sign in"
          onClick={() => setModalOpen(true)}
          className="sm:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
        >
          <LogIn className="h-4 w-4" />
        </button>
        <AuthModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  // Logged in — show initials avatar with dropdown.
  const initial = (user.email?.[0] || "?").toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Account menu"
        aria-expanded={menuOpen}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white cursor-pointer transition-transform",
          "bg-gradient-to-br from-brand-600 to-brand-400 hover:scale-105"
        )}
      >
        {initial}
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white shadow-lg p-2 z-40 animate-fade-in-up dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <Cloud className="h-3 w-3" />
              Synced to cloud
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {user.email}
            </div>
          </div>
          <button
            onClick={async () => {
              setMenuOpen(false);
              await signOut();
            }}
            className="w-full mt-1 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Small label that lives in the home page hero / Tracker description to
 * communicate the local-vs-cloud state without requiring the user to dig.
 */
export function StorageStatusBadge() {
  const { ready, authAvailable, user } = useAuth();
  if (!authAvailable || !ready) return null;
  if (user) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400">
        <Cloud className="h-3 w-3" />
        Synced
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
      <UserIcon className="h-3 w-3" />
      Local-only
    </span>
  );
}
