"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Single browser-side Supabase client. Created lazily on first access so the
 * app still boots when env vars aren't set (local-first / no-account mode).
 *
 * `isSupabaseConfigured()` is the contract every consumer checks before using
 * the client — components branch on auth-availability rather than guarding
 * every call.
 */
let cached: SupabaseClient | null = null;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase env vars are not set. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local."
    );
  }
  if (!cached) {
    cached = createClient(url!, anonKey!, {
      auth: {
        // Persist the session in localStorage so reload keeps the user logged in.
        persistSession: true,
        // Refresh access tokens automatically before expiry.
        autoRefreshToken: true,
        // Detect the session token in the URL after an OAuth redirect.
        detectSessionInUrl: true,
      },
    });
  }
  return cached;
}
