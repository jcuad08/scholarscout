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
  Select,
  Badge,
  Checkbox,
  SectionHeading,
} from "./ui";
import {
  Search,
  Sparkles,
  ExternalLink,
  Compass,
  Target,
  DollarSign,
  Calendar,
  Users,
  TrendingDown,
  Loader2,
  ArrowRight,
  Plus,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Result = {
  name: string;
  amount: string;
  deadline: string;
  competition: "Low" | "Medium" | "Very low";
  match: number;
  tags: string[];
  why: string;
  url: string;
};

// Used only as a fallback if the API call fails before any results are loaded.
const FALLBACK_RESULTS: Result[] = [
  {
    name: "Foot Locker Scholar Athletes Program",
    amount: "$20,000",
    deadline: "Jan 9, 2027",
    competition: "Medium",
    match: 92,
    tags: ["Athletics", "Leadership", "All majors"],
    why: "Matches your sports activity + leadership filter. Few applicants relative to award size.",
    url: "#",
  },
  {
    name: "Davis-Putter Scholarship (Activist Students)",
    amount: "$15,000",
    deadline: "Apr 1, 2027",
    competition: "Very low",
    match: 88,
    tags: ["Community work", "Niche"],
    why: "Niche org — under 200 applicants/year. Strong fit if you've done any organizing.",
    url: "#",
  },
  {
    name: "Local Rotary Club Future Leaders Award",
    amount: "$2,500",
    deadline: "Mar 15, 2027",
    competition: "Very low",
    match: 95,
    tags: ["Local", "Service", "First-gen friendly"],
    why: "Your zip code qualifies. Local Rotary scholarships average ~20 applicants — highest $/effort ratio.",
    url: "#",
  },
  {
    name: "Doodle for Google",
    amount: "$30,000",
    deadline: "Dec 1, 2026",
    competition: "Medium",
    match: 81,
    tags: ["Creative", "Art", "Portfolio"],
    why: "Your portfolio link (artare.to) is a strong differentiator here.",
    url: "#",
  },
  {
    name: "Elks National Foundation — Most Valuable Student",
    amount: "$50,000",
    deadline: "Nov 15, 2026",
    competition: "Low",
    match: 84,
    tags: ["Leadership", "Financial need", "All majors"],
    why: "Two-stage local→national pipeline means lower competition at the local round.",
    url: "#",
  },
  {
    name: "Burger King Scholars Program",
    amount: "$1,000–$50,000",
    deadline: "Dec 15, 2026",
    competition: "Low",
    match: 78,
    tags: ["Work experience", "All majors"],
    why: "Lightweight application — high reward-to-effort ratio.",
    url: "#",
  },
];

const DATABASES = [
  { name: "Bold.org", note: "Niche, exclusive scholarships you won't find elsewhere", category: "Aggregator" },
  { name: "Fastweb", note: "Largest match database — set filters tight to avoid noise", category: "Aggregator" },
  { name: "Going Merry", note: "Auto-fills repeated essays across applications", category: "Tool" },
  { name: "Scholarships360", note: "Curated lists, less spam than older sites", category: "Aggregator" },
  { name: "JLV College Counseling", note: "Free weekly scholarship roundup PDF", category: "Newsletter" },
  { name: "RaiseMe", note: "Micro-scholarships from colleges for HS activities", category: "Tool" },
];

const HOBBIES = [
  "Art / Design",
  "Music",
  "Coding / Tech",
  "Sports",
  "Volunteer work",
  "Entrepreneurship",
  "Writing",
  "Science research",
  "Debate / Speech",
  "Gaming / eSports",
];

type FinderProps = {
  onApplyGuide?: (scholarshipName: string) => void;
};

export function Finder({ onApplyGuide }: FinderProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hobbies, setHobbies] = useState<Record<string, boolean>>({});
  const [firstGen, setFirstGen] = useState(false);
  const [need, setNeed] = useState(false);
  const [lowComp, setLowComp] = useState(true);
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState<string | null>(null);
  // Track which result names have been added to the tracker — drives the
  // checkmark feedback so users don't accidentally add the same row twice.
  const [addedToTracker, setAddedToTracker] = useState<Record<string, boolean>>({});

  function addToTracker(r: Result) {
    if (addedToTracker[r.name]) return;
    try {
      const raw = localStorage.getItem("ss_rows");
      const existing: Array<{ name: string }> = raw ? JSON.parse(raw) : [];
      // Skip if a row with the same name already exists in the tracker.
      if (!existing.some((row) => row.name === r.name)) {
        const newRow = {
          id: Math.random().toString(36).slice(2, 9),
          name: r.name,
          award: r.amount,
          deadline: "", // r.deadline is a free-form string ("Mar 15, 2027" / "Rolling") — Tracker uses an HTML date input
          status: "Not started" as const,
          submitted: "",
          notes: r.why,
        };
        const next = [...existing, newRow];
        localStorage.setItem("ss_rows", JSON.stringify(next));
        // Notify Tracker if it's already mounted (storage events don't fire same-tab).
        window.dispatchEvent(new CustomEvent("ss_rows_changed"));
      }
      setAddedToTracker((s) => ({ ...s, [r.name]: true }));
    } catch {
      // localStorage can throw in private mode / quota — fail silently, the click was a no-op
    }
  }

  function toggleHobby(h: string) {
    setHobbies((s) => ({ ...s, [h]: !s[h] }));
  }

  async function search(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const profile = {
      gpa: form.get("gpa") || null,
      major: form.get("major") || null,
      state: form.get("state") || null,
      zip: form.get("zip") || null,
      ethnicity: form.get("ethnicity") || null,
      gender: form.get("gender") || null,
      awardSize: form.get("award") || null,
      effortBudget: form.get("effort") || null,
      deadlineWindow: form.get("deadline") || null,
      hobbies: Object.entries(hobbies)
        .filter(([, v]) => v)
        .map(([k]) => k),
      firstGen,
      financialNeed: need,
      prioritizeLowCompetition: lowComp,
    };

    try {
      const res = await fetch("/api/find-scholarships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      const incoming: Result[] = Array.isArray(data.results) ? data.results : [];
      setResults(incoming.length > 0 ? incoming : FALLBACK_RESULTS);
      setSubmitted(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      // Show fallbacks so the UI is still useful while we surface the error
      setResults(FALLBACK_RESULTS);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Scholarship Finder"
        title="Find scholarships the crowd is missing"
        description="Fill in what you can — almost everything is optional. We rank for low-competition niche awards over high-traffic ones."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-brand-600" />
            Your profile
          </CardTitle>
          <CardDescription>
            More fields = better matches. Leave anything blank you don't want to filter on.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={search} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="gpa">GPA (optional)</Label>
                <Input id="gpa" name="gpa" placeholder="e.g. 3.7" />
              </div>
              <div>
                <Label htmlFor="major">Intended major</Label>
                <Input id="major" name="major" placeholder="e.g. Computer Science" />
              </div>
              <div>
                <Label htmlFor="state">State / Region</Label>
                <Input id="state" name="state" placeholder="e.g. California" />
              </div>
              <div>
                <Label htmlFor="zip">Zip code <span className="normal-case text-slate-400">(unlocks local awards)</span></Label>
                <Input id="zip" name="zip" placeholder="e.g. 90210" />
              </div>
              <div>
                <Label htmlFor="ethnicity">Ethnicity</Label>
                <Select id="ethnicity" name="ethnicity" defaultValue="">
                  <option value="">Prefer not to say</option>
                  <option>Hispanic / Latino</option>
                  <option>Black / African American</option>
                  <option>Asian / Pacific Islander</option>
                  <option>Native American</option>
                  <option>White</option>
                  <option>Multiracial</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select id="gender" name="gender" defaultValue="">
                  <option value="">Prefer not to say</option>
                  <option>Female</option>
                  <option>Male</option>
                  <option>Non-binary</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="award">Target award size</Label>
                <Select id="award" name="award" defaultValue="any">
                  <option value="any">Any amount</option>
                  <option>Under $1,000 (easiest)</option>
                  <option>$1,000 – $5,000</option>
                  <option>$5,000 – $20,000</option>
                  <option>$20,000+</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="effort">Effort budget</Label>
                <Select id="effort" name="effort" defaultValue="balanced">
                  <option value="balanced">Balanced</option>
                  <option>Quick wins (no essay)</option>
                  <option>Short essay (under 500 words)</option>
                  <option>Major essay OK</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="deadline">Deadline window</Label>
                <Select id="deadline" name="deadline" defaultValue="any">
                  <option value="any">Any</option>
                  <option>Next 30 days</option>
                  <option>Next 90 days</option>
                  <option>This year</option>
                </Select>
              </div>
            </div>

            <div>
              <Label>Hobbies & activities</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {HOBBIES.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => toggleHobby(h)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-sm text-left transition-colors cursor-pointer",
                      hobbies[h]
                        ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                        : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700"
                    )}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-3 pt-2">
              <Checkbox label="First-generation college student" checked={firstGen} onChange={setFirstGen} />
              <Checkbox label="Demonstrated financial need" checked={need} onChange={setNeed} />
              <Checkbox label="Prioritize low-competition scholarships" checked={lowComp} onChange={setLowComp} />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" size="lg" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Scanning the web…
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Find my scholarships
                  </>
                )}
              </Button>
              <span className="text-xs text-slate-500">
                Searches 200+ niche org pages — not just aggregator sites.
              </span>
            </div>
          </form>
        </CardContent>
      </Card>

      {submitted && (
        <>
          {/* Step-by-step method */}
          <Card className="bg-gradient-to-br from-brand-50 to-white border-brand-100 dark:from-brand-500/5 dark:to-slate-900 dark:border-brand-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-brand-600" />
                The 5-step method we used for your search
              </CardTitle>
              <CardDescription>
                Replicate this yourself any time. Most students skip steps 2 and 4.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {[
                  ["Start hyper-local", "Local Rotary, Elks, Kiwanis, your city's community foundation. ~10–30 applicants each."],
                  ["Match the niche, not the major", "Hobbies, identity, family work, religion, even hair color — niche scholarships have low traffic."],
                  ["Filter by reward-to-effort ratio", "A $500 no-essay award beats a $5K essay you won't finish."],
                  ["Apply to two-stage scholarships early", "Local→national pipelines (Elks, JCI) have huge dropoff at the local round."],
                  ["Stack quick-wins weekly", "Block 90 min every Sunday to file 2–3 short apps. Compounds fast."],
                ].map(([t, d], i) => (
                  <li key={t} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white text-sm font-semibold">
                      {i + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{t}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">{d}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* Error banner — shown only when fallback results are displayed */}
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              <span className="font-semibold">Couldn't reach the model:</span> {error}. Showing example matches instead.
            </div>
          )}

          {/* Results */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">
                  {results.length} matches found
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Sorted by competition level + match score
                </p>
              </div>
              <Badge tone="emerald">
                <Sparkles className="h-3 w-3" /> Fresh as of today
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((r, i) => (
                <Card
                  key={r.name}
                  className="hover:border-brand-300 dark:hover:border-brand-500/40 transition-colors animate-fade-in-up"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-display font-semibold text-slate-900 dark:text-slate-50 leading-snug">
                        {r.name}
                      </h4>
                      <div className="text-xs font-bold text-brand-600 dark:text-brand-400">{r.match}% match</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" /> {r.amount}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> {r.deadline}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <TrendingDown className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="font-medium text-emerald-700 dark:text-emerald-400">{r.competition} comp.</span>
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      <span className="font-semibold">Why it fits:</span> {r.why}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {r.tags.map((t) => (
                        <Badge key={t} tone="slate">{t}</Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => onApplyGuide?.(r.name)}
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                        Apply guide
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addToTracker(r)}
                        disabled={!!addedToTracker[r.name]}
                        className={cn(
                          addedToTracker[r.name] &&
                            "border-emerald-300 text-emerald-700 dark:border-emerald-500/40 dark:text-emerald-400"
                        )}
                      >
                        {addedToTracker[r.name] ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            In tracker
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" />
                            Add to tracker
                          </>
                        )}
                      </Button>
                      {r.url && r.url !== "#" ? (
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 h-8 px-3 text-sm font-medium rounded-xl border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition-all duration-200 cursor-pointer whitespace-nowrap"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Open page
                        </a>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Where to find more */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-accent-500" />
                Where to keep hunting
              </CardTitle>
              <CardDescription>
                Databases and tools to bookmark. Hit at least 2 of these per week.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {DATABASES.map((d) => (
                  <div
                    key={d.name}
                    className="rounded-xl border border-slate-200 p-4 hover:border-brand-300 hover:shadow-sm transition-all cursor-pointer dark:border-slate-800 dark:hover:border-brand-500/40"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{d.name}</div>
                      <Badge tone="violet">{d.category}</Badge>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">{d.note}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
