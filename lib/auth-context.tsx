"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "./supabase";

type AuthContextValue = {
  /** True once the initial session restoration completes. UI should block
   *  on this before deciding what to render to avoid hydration flashes. */
  ready: boolean;
  /** True if env vars are present and auth is wired. False = local-only mode. */
  authAvailable: boolean;
  user: User | null;
  session: Session | null;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const authAvailable = isSupabaseConfigured();

  useEffect(() => {
    if (!authAvailable) {
      setReady(true);
      return;
    }
    const sb = getSupabase();

    // Restore any existing session on mount.
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setReady(true);
    });

    // Subscribe to future sign-in / sign-out / token-refresh events.
    const { data: sub } = sb.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [authAvailable]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      if (!authAvailable) return { error: "Auth is not configured." };
      const { error } = await getSupabase().auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    },
    [authAvailable]
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      if (!authAvailable) return { error: "Auth is not configured.", needsConfirmation: false };
      const { data, error } = await getSupabase().auth.signUp({
        email,
        password,
        options: {
          // After email confirmation, send the user back to the site.
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/` : undefined,
        },
      });
      // Supabase returns a user but no session when email confirmation is required.
      const needsConfirmation = !!data.user && !data.session;
      return { error: error?.message ?? null, needsConfirmation };
    },
    [authAvailable]
  );

  const signInWithGoogle = useCallback(async () => {
    if (!authAvailable) return { error: "Auth is not configured." };
    const { error } = await getSupabase().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: typeof window !== "undefined" ? `${window.location.origin}/` : undefined,
      },
    });
    // OAuth navigates the page away — the auth state change listener picks
    // up the session when the user lands back on the site.
    return { error: error?.message ?? null };
  }, [authAvailable]);

  const signOut = useCallback(async () => {
    if (!authAvailable) return;
    await getSupabase().auth.signOut();
  }, [authAvailable]);

  return (
    <Ctx.Provider
      value={{
        ready,
        authAvailable,
        user,
        session,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
