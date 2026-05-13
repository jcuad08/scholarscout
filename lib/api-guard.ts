import { NextResponse } from "next/server";

/**
 * Shared guards for the AI API routes. Three concerns in one place:
 *   - Input size + type validation
 *   - Prompt-injection mitigation (sanitize user-supplied strings before they
 *     hit the model context)
 *   - Per-IP in-memory rate limiting so an attacker can't drain the user's
 *     Gemini quota or rack up Vercel hours
 *
 * In-memory rate limiting is intentionally per-process: serverless invocations
 * share state only within a warm container, but for the threat model
 * (drive-by abuse) that's enough — sustained attackers get throttled by the
 * cold-start tax instead.
 */

/* ---------- Sizing constants ---------- */

export const LIMITS = {
  /** Max raw POST body size before we even parse JSON. */
  REQUEST_BYTES: 64 * 1024, // 64 KB — generous for any of our payloads
  /** Max length of any single user-supplied string field. */
  STRING_FIELD: 500,
  /** Max length of an essay draft (the largest legitimate input). */
  ESSAY_DRAFT: 10_000, // ~1500 words; comfortably above any real essay
  /** Max scholarship name length. */
  SCHOLARSHIP_NAME: 200,
  /** Max items in any user-supplied array (e.g. excludeNames, hobbies). */
  ARRAY_ITEMS: 200,
  /** Max items in tracker rows array sent to the recommend route. */
  TRACKER_ROWS: 200,
  /** Rate limit window in ms. */
  RATE_WINDOW_MS: 60_000,
  /** Max requests per IP per window. 30/min gives real users plenty of room
   *  (a typical session is ~5-10 AI calls) while still throttling drive-by
   *  abuse. An attacker would need 1800+ unique IPs/hour to drain quota. */
  RATE_MAX: 30,
} as const;

/* ---------- Body-size guard ---------- */

/**
 * Reads + size-checks the raw body, then parses JSON. Returns either the
 * parsed body OR a NextResponse error to bail with.
 */
export async function readSafeJson(request: Request): Promise<
  | { ok: true; body: unknown }
  | { ok: false; response: NextResponse }
> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > LIMITS.REQUEST_BYTES) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Request too large." },
        { status: 413 }
      ),
    };
  }

  // Even without a content-length header, cap the actual body we read.
  const text = await request.text();
  if (text.length > LIMITS.REQUEST_BYTES) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Request too large." },
        { status: 413 }
      ),
    };
  }

  try {
    return { ok: true, body: text.length > 0 ? JSON.parse(text) : {} };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 }
      ),
    };
  }
}

/* ---------- Sanitization ---------- */

/**
 * Sanitize a user-supplied string before it goes into a Gemini prompt.
 * We can't fully prevent prompt injection (the model is a black box), but
 * we can:
 *   - Cap length so an attacker can't pad context with their own instructions
 *   - Strip control characters that aid in delimiter forgery
 *   - Collapse repeated whitespace to defeat ASCII-art smuggling
 *   - Remove our own internal delimiters so the user can't fake an "end of
 *     user input" boundary
 */
const INTERNAL_DELIMITERS = [
  "--- DRAFT START ---",
  "--- DRAFT END ---",
  "--- USER INPUT START ---",
  "--- USER INPUT END ---",
  "<system>",
  "</system>",
  "<system_instruction>",
  "</system_instruction>",
];

export function sanitizeForPrompt(value: unknown, maxLen: number = LIMITS.STRING_FIELD): string {
  if (typeof value !== "string") return "";
  let s = value;
  for (const d of INTERNAL_DELIMITERS) {
    // Case-insensitive global replace — strip any attempt to forge our markers.
    s = s.replace(new RegExp(d.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "gi"), "");
  }
  // Strip control characters except newlines + tabs.
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  // Collapse runs of newlines to two (paragraph break) so attackers can't
  // pad context with thousands of blank lines.
  s = s.replace(/\n{3,}/g, "\n\n");
  // Hard cap. We slice on chars (not bytes) — sufficient for our purposes.
  return s.trim().slice(0, maxLen);
}

/** Sanitize and bound an array of strings (e.g. excludeNames, hobbies). */
export function sanitizeStringArray(
  value: unknown,
  maxItems: number = LIMITS.ARRAY_ITEMS,
  maxItemLen: number = LIMITS.STRING_FIELD
): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, maxItems)
    .map((v) => sanitizeForPrompt(v, maxItemLen))
    .filter((s) => s.length > 0);
}

/* ---------- Rate limiting ---------- */

const buckets = new Map<string, number[]>();

/** Returns true if the request should be allowed; false if rate-limited. */
function checkRate(key: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const windowStart = now - LIMITS.RATE_WINDOW_MS;
  const arr = (buckets.get(key) ?? []).filter((t) => t > windowStart);
  if (arr.length >= LIMITS.RATE_MAX) {
    const oldest = arr[0];
    return {
      allowed: false,
      retryAfterSec: Math.ceil((oldest + LIMITS.RATE_WINDOW_MS - now) / 1000),
    };
  }
  arr.push(now);
  buckets.set(key, arr);
  // Periodically prune the map so it doesn't grow unbounded.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      const fresh = v.filter((t) => t > windowStart);
      if (fresh.length === 0) buckets.delete(k);
      else buckets.set(k, fresh);
    }
  }
  return { allowed: true, retryAfterSec: 0 };
}

export function rateLimitGuard(request: Request, routeKey: string): NextResponse | null {
  // Skip in dev so local development + Playwright tests aren't artificially
  // throttled. Production deploys (NODE_ENV='production') still enforce.
  if (process.env.NODE_ENV !== "production") return null;

  // Identify caller. Vercel sets x-forwarded-for; fall back to x-real-ip; then
  // a constant (which throttles ALL anonymous traffic together — fine as a
  // backstop, painful for a dedicated attacker but cheap to implement).
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const key = `${routeKey}:${ip}`;
  const result = checkRate(key);
  if (!result.allowed) {
    return NextResponse.json(
      { error: `Rate limited. Try again in ${result.retryAfterSec}s.` },
      {
        status: 429,
        headers: { "Retry-After": String(result.retryAfterSec) },
      }
    );
  }
  return null;
}
