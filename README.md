# ScholarScout

A scholarship finder, application helper, and tracker built for incoming college freshmen. Surfaces low-competition niche awards over high-traffic ones — and gives you a method for actually applying.

Inspired by the Claude skill that uses the scholarship tracker template — this is the same idea, but a website you can sit in front of.

## Features

- **Finder** — Profile form (most fields optional) → ranked niche scholarship matches + a 5-step method + databases to keep hunting. Each result has **Apply guide** (jumps to Apply Helper with the scholarship pre-filled) and **Add to tracker** (drops the row into the Tracker tab).
- **Apply Helper** — Type in a scholarship → custom 6-step plan, free tools to use, essay outline, and a built-in essay coach that scores your draft.
- **Tips Hub** — 8 places students forget to look (local businesses, civic clubs, niche orgs, employers, religious/cultural orgs, etc.) + scam red flags + how often to check.
- **School Matches** — Add your target college, get school-specific institutional + departmental + alumni + around-campus awards.
- **Tracker** — Active applications table that auto-logs wins/rejections to a lifetime stats panel, plus a reusable materials checklist (resume, transcripts, essays, recs, headshot, portfolio). **Local-first by default**: persists to `localStorage` with no account required. **Optional cloud sync** via Supabase (email/password or Google) — sign in once and your tracker follows you across devices. The first sign-in opportunistically migrates any existing local data to your account.
- **Recommendations** — On the Tracker tab: reads what you're already pursuing and suggests 5-8 NEW complementary scholarships, ranked by competition and how well they fill gaps in your existing list. Inferred from patterns (e.g. local Rotary in tracker → suggests adjacent civic orgs; HSF in tracker → suggests aligned professional Hispanic orgs).

## Stack

- Next.js 14 (App Router)
- Tailwind CSS 3
- Lightweight shadcn/ui-style components (in `components/ui.tsx`)
- Lucide icons
- TypeScript

Light/dark mode, responsive (mobile → desktop), fully keyboard accessible.

## Run

```bash
npm install
cp .env.example .env.local       # then add your GEMINI_API_KEY
npm run dev
```

Then open <http://localhost:3000>.

Get a free Gemini key (instant, no billing required) at <https://aistudio.google.com/apikey>.

**Optional — enable cloud sync for the Tracker:**

1. Create a free Supabase project at <https://supabase.com/dashboard>.
2. Settings → API → copy the **Project URL** and **anon / public key** into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. SQL Editor → paste the contents of `supabase/schema.sql` → Run. Creates the three tracker tables with Row Level Security policies.
4. (Optional) Authentication → Providers → enable Google. You'll need to create OAuth credentials in Google Cloud Console — paste the Supabase callback URL into your Google OAuth client's authorized redirect URIs, then paste the Google Client ID + Secret back into Supabase.

Without the Supabase env vars set, the app works exactly the same — it just stays in local-first mode (the auth UI doesn't appear).

## API integration

Four features are wired to the Google Gemini API via Next.js route handlers:

| Route | Powers | Model |
|---|---|---|
| `POST /api/find-scholarships` | The Finder tab — sends the user's profile, returns ranked niche scholarship matches as structured JSON. | `gemini-2.5-flash` |
| `POST /api/score-essay` | The Apply Helper essay coach — sends the user's draft + target scholarship, returns 4-6 actionable feedback bullets. | `gemini-2.5-flash` |
| `POST /api/school-scholarships` | The School Matches tab — sends a college name, returns institutional + around-campus awards specific to that school as structured JSON. | `gemini-2.5-flash` |
| `POST /api/recommend-from-tracker` | The "Recommended for you" section in the Tracker tab — sends the user's existing tracker rows, returns complementary new scholarships inferred from the patterns. | `gemini-2.5-flash` |

All four routes use the `@google/genai` SDK with `responseSchema` for structured JSON output and typed error handling (`ApiError`). Thinking is disabled (`thinkingBudget: 0`) to keep latency low and stay inside the free tier. `maxDuration` is set to 30s on each route to give cold starts headroom on Vercel Hobby's default 10s function timeout. Errors surface as red inline banners in the UI; Finder and School Matches fall back to example results so the page stays usable.

The remaining section (Tips Hub) is pure-frontend — no API calls.

## Persistence + Auth

The Tracker uses a **dual-mode storage layer** (see `lib/tracker-storage.ts`):

- **Logged out (default):** `localStorage` keys `ss_rows`, `ss_log`, `ss_materials`. No account, no network. The Finder dispatches an in-page `ss_rows_changed` CustomEvent when adding to tracker so an open Tracker tab syncs without remounting.
- **Logged in:** Supabase (`tracker_rows`, `tracker_log`, `tracker_materials` tables in `supabase/schema.sql`). Row Level Security ensures users only see their own data. Writes are debounced 600 ms to collapse keystroke flurries into single round-trips.
- **First sign-in migration:** if the user has any localStorage data when they first sign in, it's uploaded to their account (deduped by name vs cloud), then localStorage is cleared so the two stores can't drift afterwards. A toast shows what was synced.

Auth is handled by `@supabase/supabase-js` with email/password + Google OAuth. The `AuthProvider` in `lib/auth-context.tsx` exposes a `useAuth()` hook with the current `user`, sign-in/up/out methods, and an `authAvailable` flag (false when `NEXT_PUBLIC_SUPABASE_URL`/`_ANON_KEY` env vars are missing — the app then gracefully runs in pure local-first mode).

## Notes

- The Finder asks the model not to invent fake scholarships and to prioritize local/niche awards over the famous-50. Quality of matches depends on what the user fills in — leaving everything blank produces generic results.
- The essay coach refuses to rewrite essays or assign a grade — it only returns feedback bullets, citing phrases from the draft.
