"use client";

import { useEffect, useState } from "react";
import { Button, Input, Label } from "./ui";
import { useAuth } from "@/lib/auth-context";
import { GraduationCap, Loader2, X, Cloud, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

export function AuthModal({
  open,
  onClose,
  initialMode = "signin",
}: {
  open: boolean;
  onClose: () => void;
  initialMode?: Mode;
}) {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, authAvailable } = useAuth();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  // Reset state when the modal closes so re-opening is clean.
  useEffect(() => {
    if (!open) {
      setError(null);
      setConfirmationSent(false);
      setLoading(false);
    } else {
      setMode(initialMode);
    }
  }, [open, initialMode]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await signInWithEmail(email, password);
        if (error) setError(error);
        else onClose();
      } else {
        const { error, needsConfirmation } = await signUpWithEmail(email, password);
        if (error) setError(error);
        else if (needsConfirmation) setConfirmationSent(true);
        else onClose();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error);
      setLoading(false);
    }
    // On success the page navigates away to Google's OAuth — don't reset loading.
  }

  return (
    <div
      // Scrollable overlay: when the modal content is taller than the viewport
      // (short windows, mobile, zoomed-in users), the OUTER div scrolls so the
      // whole modal stays reachable. `items-center` on the inner flex wrapper
      // centers the modal when content is short enough; `min-h-full` ensures
      // the wrapper still fills the viewport so centering works.
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm animate-fade-in-up"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="flex min-h-full items-center justify-center p-4">
      <div
        className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="font-display font-bold text-slate-900 dark:text-slate-50">
              ScholarScout
            </div>
          </div>

          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mt-3">
            {mode === "signin" ? "Welcome back" : "Sync across devices"}
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
            {mode === "signin"
              ? "Sign in to access your Tracker and Recommendations from any device."
              : "Create an account so your tracker follows you. Free, no spam."}
          </p>

          {!authAvailable && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              Cloud sync isn't configured on this deployment. Your data stays
              local in your browser — no sign-in needed.
            </div>
          )}

          {confirmationSent ? (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                Check your email
              </div>
              <div className="mt-1 text-xs">
                We sent a confirmation link to <span className="font-semibold">{email}</span>.
                Click it to finish creating your account, then come back and sign in.
              </div>
            </div>
          ) : (
            <>
              <div className="mt-5 flex gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                {(["signin", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    disabled={!authAvailable || loading}
                    onClick={() => {
                      setMode(m);
                      setError(null);
                    }}
                    className={cn(
                      "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer",
                      mode === m
                        ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-50"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                    )}
                  >
                    {m === "signin" ? "Sign in" : "Sign up"}
                  </button>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogle}
                disabled={!authAvailable || loading}
                className="mt-5 w-full h-11"
              >
                <GoogleIcon className="h-4 w-4" />
                Continue with Google
              </Button>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                <span className="text-xs text-slate-400 uppercase tracking-wider">or</span>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              </div>

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "signup" ? "At least 6 characters" : ""}
                  />
                </div>

                {error && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                    {error}
                  </div>
                )}

                <Button type="submit" disabled={!authAvailable || loading} className="w-full h-11">
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : mode === "signin" ? (
                    "Sign in"
                  ) : (
                    <>
                      <Cloud className="h-4 w-4" />
                      Create account
                    </>
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

// Inline SVG so we don't pull in another icon dep just for the Google glyph.
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
