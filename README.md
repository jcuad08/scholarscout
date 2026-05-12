# ScholarScout

A scholarship finder, application helper, and tracker built for incoming college freshmen. Surfaces low-competition niche awards over high-traffic ones — and gives you a method for actually applying.

Inspired by the Claude skill that uses the scholarship tracker template — this is the same idea, but a website you can sit in front of.

## Features

- **Finder** — Profile form (most fields optional) → ranked niche scholarship matches + a 5-step method + databases to keep hunting. Each result has **Apply guide** (jumps to Apply Helper with the scholarship pre-filled) and **Add to tracker** (drops the row into the Tracker tab).
- **Apply Helper** — Type in a scholarship → custom 6-step plan, free tools to use, essay outline, and a built-in essay coach that scores your draft.
- **Tips Hub** — 8 places students forget to look (local businesses, civic clubs, niche orgs, employers, religious/cultural orgs, etc.) + scam red flags + how often to check.
- **School Matches** — Add your target college, get school-specific institutional + departmental + alumni + around-campus awards.
- **Tracker** — Active applications table that auto-logs wins/rejections to a lifetime stats panel, plus a reusable materials checklist (resume, transcripts, essays, recs, headshot, portfolio). Persists to localStorage. Empty-state for new users.

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

## API integration

Three features are wired to the Google Gemini API via Next.js route handlers:

| Route | Powers | Model |
|---|---|---|
| `POST /api/find-scholarships` | The Finder tab — sends the user's profile, returns ranked niche scholarship matches as structured JSON. | `gemini-2.5-flash` |
| `POST /api/score-essay` | The Apply Helper essay coach — sends the user's draft + target scholarship, returns 4–6 actionable feedback bullets. | `gemini-2.5-flash` |
| `POST /api/school-scholarships` | The School Matches tab — sends a college name, returns institutional + around-campus awards specific to that school as structured JSON. | `gemini-2.5-flash` |

All three routes use the `@google/genai` SDK with `responseSchema` for structured JSON output and typed error handling (`ApiError`). Thinking is disabled (`thinkingBudget: 0`) to keep latency low and stay inside the free tier. Errors surface as red inline banners in the UI; Finder and School Matches fall back to example results so the page stays usable.

The other two sections (Tips Hub, Tracker) are pure-frontend — no API calls. The Tracker uses `localStorage` for persistence (`ss_rows`, `ss_log`, `ss_materials`) and listens for an in-page `ss_rows_changed` CustomEvent so Finder can push rows into it without a navigation roundtrip.

## Notes

- The Finder asks the model not to invent fake scholarships and to prioritize local/niche awards over the famous-50. Quality of matches depends on what the user fills in — leaving everything blank produces generic results.
- The essay coach refuses to rewrite essays or assign a grade — it only returns feedback bullets, citing phrases from the draft.
