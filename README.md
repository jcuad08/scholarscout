# ScholarScout

A scholarship finder, application helper, and tracker built for incoming college freshmen. Surfaces low-competition niche awards over high-traffic ones — and gives you a method for actually applying.

Inspired by the Claude skill that uses the scholarship tracker template — this is the same idea, but a website you can sit in front of.

## Features

- **Finder** — Profile form (most fields optional) → ranked niche scholarship matches + a 5-step method + databases to keep hunting.
- **Apply Helper** — Type in a scholarship → custom 6-step plan, free tools to use, essay outline, and a built-in essay coach that scores your draft.
- **Tips Hub** — 8 places students forget to look (local businesses, civic clubs, niche orgs, employers, religious/cultural orgs, etc.) + scam red flags + how often to check.
- **School Matches** — Add your target college, get institutional + departmental + alumni + nearby awards.
- **Tracker** — Active applications table, won/lost log, reusable materials checklist (resume, transcripts, essays, recs, headshot, portfolio). Persists to localStorage.

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

Two features are wired to the Google Gemini API via Next.js route handlers:

| Route | Powers | Model |
|---|---|---|
| `POST /api/find-scholarships` | The Finder tab — sends the user's profile, returns ranked niche scholarship matches as structured JSON. | `gemini-2.5-flash` |
| `POST /api/score-essay` | The Apply Helper essay coach — sends the user's draft + target scholarship, returns 4–6 actionable feedback bullets. | `gemini-2.5-flash` |

Both routes use the `@google/genai` SDK with `responseSchema` for structured JSON output and typed error handling (`ApiError`). Thinking is disabled (`thinkingBudget: 0`) to keep latency low and stay inside the free tier. Errors surface as red inline banners in the UI; the Finder falls back to example matches so the page stays usable.

The other three sections (Tips Hub, School Matches, Tracker) are pure-frontend — no API calls.

## Notes

- The Finder asks the model not to invent fake scholarships and to prioritize local/niche awards over the famous-50. Quality of matches depends on what the user fills in — leaving everything blank produces generic results.
- The essay coach refuses to rewrite essays or assign a grade — it only returns feedback bullets, citing phrases from the draft.
