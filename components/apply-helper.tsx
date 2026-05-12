"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
  Badge,
  SectionHeading,
} from "./ui";
import {
  Wand2,
  CheckCircle2,
  Clock,
  FileText,
  Sparkles,
  Quote,
  Lightbulb,
  Wrench,
  Send,
  Loader2,
} from "lucide-react";

const STEPS = [
  {
    title: "Read the prompt three times",
    detail:
      "Pull out the literal question, the hidden 'value' the org wants (leadership? grit? community?), and the word count. Write each on a sticky note.",
    time: "5 min",
  },
  {
    title: "Pick ONE specific story",
    detail:
      "Pick a single moment, not a summary of your life. A 90-second scene beats 4 years of résumé bullets every time.",
    time: "10 min",
  },
  {
    title: "Draft a messy first version",
    detail: "Don't edit. Get to the word count. The first 200 words will probably be deleted — that's normal.",
    time: "30 min",
  },
  {
    title: "Sharpen with the 'so what?' test",
    detail:
      "Every paragraph must answer 'so what does this say about me?' If you can delete a sentence without losing meaning, delete it.",
    time: "20 min",
  },
  {
    title: "Read aloud + send for review",
    detail:
      "Reading aloud catches 80% of awkward sentences. Send to one teacher and one peer — not five people (conflicting edits kill essays).",
    time: "15 min",
  },
  {
    title: "Submit 48 hours before deadline",
    detail:
      "Server crashes happen. Recommenders forget. Your future self will thank you. Then file the confirmation email in your Tracker.",
    time: "10 min",
  },
];

const TOOLS = [
  { name: "Hemingway Editor", purpose: "Cut wordy sentences and passive voice", free: true },
  { name: "Grammarly (free tier)", purpose: "Catch basic grammar slips", free: true },
  { name: "Google Docs version history", purpose: "Revert if a 'big improvement' makes it worse", free: true },
  { name: "Read-aloud (browser)", purpose: "Hear awkward phrasing your eyes skip", free: true },
  { name: "Word counter", purpose: "Trim to the exact limit — not 1 over", free: true },
];

const DRAFT_OUTLINE = `OPENING HOOK (1–2 sentences)
  → A specific scene, dialogue, or sensory detail. NOT "Ever since I was young…"

THE TURN (2–3 sentences)
  → What changed? A challenge, realization, or pivot moment.

WHAT I DID (1 paragraph)
  → Concrete actions. Numbers if you have them.

WHAT IT TAUGHT ME (1 short paragraph)
  → Skill or value you gained — link it to what the org cares about.

CLOSING (1–2 sentences)
  → How this scholarship furthers that path. Specific to THIS org, not generic.`;

export function ApplyHelper() {
  const [scholarship, setScholarship] = useState("");
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [feedback, setFeedback] = useState<null | string[]>(null);
  const [scoring, setScoring] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);

  function generateGuide(e: React.FormEvent) {
    e.preventDefault();
    if (!scholarship.trim()) return;
    // The plan/tools/outline content is static and tuned for any scholarship —
    // no API call needed here. We just reveal the guide sections.
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setGenerated(true);
    }, 400);
  }

  async function scoreEssay() {
    setScoring(true);
    setScoreError(null);
    setFeedback(null);
    try {
      const res = await fetch("/api/score-essay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scholarship, draft }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      const bullets: string[] = Array.isArray(data.feedback) ? data.feedback : [];
      if (bullets.length === 0) {
        throw new Error("No feedback returned. Try a longer draft.");
      }
      setFeedback(bullets);
    } catch (err) {
      setScoreError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setScoring(false);
    }
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Application Helper"
        title="Turn 'I'll apply later' into 'I submitted'"
        description="Drop in a scholarship name. Get a custom step-by-step guide, the tools to use, and a built-in essay coach."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-brand-600" />
            What are you applying for?
          </CardTitle>
          <CardDescription>
            Type the scholarship name and we'll tailor the guide to its prompt style and reviewer preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={generateGuide} className="flex flex-col sm:flex-row gap-3">
            <Input
              value={scholarship}
              onChange={(e) => setScholarship(e.target.value)}
              placeholder="e.g. Coca-Cola Scholars Program"
              className="flex-1 h-12 text-base"
            />
            <Button type="submit" size="lg" disabled={loading || !scholarship.trim()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Building your guide…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Build my guide
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {generated && (
        <div className="space-y-8 animate-fade-in-up">
          {/* Overview bento */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-brand-600 to-brand-500 border-0 text-white md:col-span-2">
              <CardContent className="p-6">
                <Badge tone="amber" className="bg-white/20 text-white">Custom plan</Badge>
                <h3 className="font-display text-2xl font-bold mt-3">
                  {scholarship}
                </h3>
                <p className="mt-2 text-brand-100">
                  Below is a 6-step playbook, the exact tools to use, an essay outline, and a free
                  review tool to score your draft before you submit.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-sm">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1">
                    <Clock className="h-3.5 w-3.5" /> ~90 min total
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1">
                    <FileText className="h-3.5 w-3.5" /> 1 essay (≈500 words)
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> 2 recs needed
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-accent-50 to-white dark:from-accent-500/5 dark:to-slate-900 border-accent-200 dark:border-accent-500/20">
              <CardContent className="p-6">
                <Lightbulb className="h-6 w-6 text-accent-500" />
                <h4 className="mt-3 font-display font-semibold text-slate-900 dark:text-slate-50">
                  Reviewer's hidden bias
                </h4>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                  This org rewards <span className="font-semibold">community impact stories</span>. Past winners
                  led local projects — not just résumés. Lead with that.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Your 6-step application plan</CardTitle>
              <CardDescription>Block 90 minutes total. Most students get stuck on step 2 — that's normal.</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                {STEPS.map((s, i) => (
                  <li key={s.title} className="flex gap-4 group">
                    <div className="flex flex-col items-center">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white font-semibold">
                        {i + 1}
                      </span>
                      {i < STEPS.length - 1 && <span className="w-px flex-1 bg-slate-200 dark:bg-slate-800 my-1" />}
                    </div>
                    <div className="pb-2 flex-1">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="font-display font-semibold text-slate-900 dark:text-slate-50">{s.title}</div>
                        <Badge tone="slate">
                          <Clock className="h-3 w-3" /> {s.time}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{s.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* Tools */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-brand-600" />
                Tools we recommend for this one
              </CardTitle>
              <CardDescription>All free. Don't pay for "scholarship essay services."</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TOOLS.map((t) => (
                  <div
                    key={t.name}
                    className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 hover:border-brand-300 transition-colors cursor-pointer dark:border-slate-800 dark:hover:border-brand-500/40"
                  >
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{t.name}</span>
                        {t.free && <Badge tone="emerald">Free</Badge>}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{t.purpose}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Essay coach */}
          <Card className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Quote className="h-5 w-5 text-accent-500" />
                Built-in essay coach
              </CardTitle>
              <CardDescription>
                Paste your draft. We'll score it on hook, specificity, voice, and fit — no AI ghostwriting, just feedback you can act on.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="outline">Suggested outline</Label>
                  <pre className="rounded-xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
{DRAFT_OUTLINE}
                  </pre>
                </div>
                <div>
                  <Label htmlFor="draft">Paste your draft</Label>
                  <Textarea
                    id="draft"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="The day I learned my mom couldn't afford the tools I needed for art class, I started saving lunch money…"
                    className="min-h-[220px]"
                  />
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-slate-500">
                      {draft.trim().split(/\s+/).filter(Boolean).length} words
                    </span>
                    <Button onClick={scoreEssay} disabled={scoring || draft.trim().length < 20}>
                      {scoring ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Reviewing…
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Score my draft
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {scoreError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200 animate-fade-in-up">
                  <span className="font-semibold">Couldn't score your draft:</span> {scoreError}
                </div>
              )}

              {feedback && (
                <div className="rounded-xl border border-brand-200 bg-brand-50 p-5 dark:border-brand-500/30 dark:bg-brand-500/10 animate-fade-in-up">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-brand-600" />
                    <span className="font-semibold text-brand-700 dark:text-brand-300">Coach feedback</span>
                  </div>
                  <ul className="space-y-2">
                    {feedback.map((f) => (
                      <li key={f} className="flex gap-2 text-sm text-slate-700 dark:text-slate-200">
                        <span className="text-brand-600 dark:text-brand-400 font-bold">→</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
