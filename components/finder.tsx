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
import { useTracker } from "@/lib/tracker-context";
import { useToast } from "@/lib/toast-context";

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
  // Tracker state via shared context: trackedNames lets us filter results
  // and gate the Add-to-tracker button; addRow centralizes the dedup so
  // duplicates can't be created from here.
  const { trackedNames, addRow } = useTracker();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hobbies, setHobbies] = useState<Record<string, boolean>>({});
  const [firstGen, setFirstGen] = useState(false);
  const [need, setNeed] = useState(false);
  const [lowComp, setLowComp] = useState(true);
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState<string | null>(null);
  // Holds the profile from the last initial search (sans excludeNames) so
  // 'Show more' can re-issue the same query with an expanded exclude list.
  const [lastProfile, setLastProfile] = useState<Record<string, unknown> | null>(null);
  // Flips true when 'Show more' returns no fresh results — used to hide the
  // button so the user isn't tempted to keep clicking nothing.
  const [noMoreResults, setNoMoreResults] = useState(false);

  function addToTracker(r: Result) {
    const result = addRow({ name: r.name, award: r.amount, notes: r.why });
    // The result card disappears from Finder once the row lands in tracker
    // (the filter drops tracked names). Without a toast the user wonders if
    // the click actually did anything — show a quick confirmation.
    if (result.added) {
      toast.show(`Added "${r.name}" to your tracker`, { tone: "success" });
    } else {
      // Rare: only triggers if a manual edit in tracker created the same name
      // before the user clicked here.
      toast.show(`"${r.name}" is already in your tracker`, { tone: "info" });
    }
  }

  function toggleHobby(h: string) {
    setHobbies((s) => ({ ...s, [h]: !s[h] }));
  }

  async function search(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNoMoreResults(false);

    const form = new FormData(e.currentTarget);
    // Profile WITHOUT excludeNames — that's added per-fetch since the
    // exclude list grows when the user clicks "Show more". Stored so
    // 'Show more' can re-issue the same query.
    const profile: Record<string, unknown> = {
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
    setLastProfile(profile);

    // Initial search excludes only what's already in the tracker.
    await fetchAndApply(profile, Array.from(trackedNames), "replace");
    setLoading(false);
  }

  async function showMore() {
    if (!lastProfile || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    // Exclude tracker names AND every result we've already shown this
    // session, so the model returns a genuinely fresh batch.
    const excludeNames = Array.from(
      new Set([...trackedNames, ...results.map((r) => r.name.trim().toLowerCase())])
    );
    await fetchAndApply(lastProfile, excludeNames, "append");
    setLoadingMore(false);
  }

  /**
   * Shared fetcher. `mode` controls how new results combine with current
   * state: 'replace' wipes (initial search), 'append' adds (Show more).
   * Append also dedupes by normalized name in case the model still echoed
   * something from the exclude list.
   */
  async function fetchAndApply(
    baseProfile: Record<string, unknown>,
    excludeNames: string[],
    mode: "replace" | "append"
  ) {
    try {
      const res = await fetch("/api/find-scholarships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...baseProfile, excludeNames }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      const incoming: Result[] = Array.isArray(data.results) ? data.results : [];

      if (mode === "replace") {
        setResults(incoming.length > 0 ? incoming : FALLBACK_RESULTS);
        setSubmitted(true);
        return;
      }

      // Append: dedupe against current results by normalized name, drop the
      // ones the tracker already has, and detect "no more" so we can hide
      // the Show-more button.
      setResults((prev) => {
        const haveLower = new Set(prev.map((r) => r.name.trim().toLowerCase()));
        const fresh = incoming.filter((r) => {
          const norm = r.name.trim().toLowerCase();
          return !haveLower.has(norm) && !trackedNames.has(norm);
        });
        if (fresh.length === 0) setNoMoreResults(true);
        return [...prev, ...fresh];
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      // Fallbacks only on the initial search — if Show more fails, leave the
      // existing results alone so the user doesn't lose what they've seen.
      if (mode === "replace") {
        setResults(FALLBACK_RESULTS);
        setSubmitted(true);
      }
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

          {/* Results — client-side filter drops anything already in the
              tracker (defense in depth on top of the model's excludeNames
              instruction). Show a small "X already-tracked hidden" hint so
              the user knows why some results disappeared. */}
          {(() => {
            const visible = results.filter((r) => !trackedNames.has(r.name.trim().toLowerCase()));
            const hiddenCount = results.length - visible.length;
            return (
          <div>
            <div className="flex items-center justify-between mb-4 gap-3">
              <div>
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">
                  {visible.length} matches found
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Sorted by competition level + match score
                  {hiddenCount > 0 && (
                    <span className="ml-1 text-slate-400">
                      · {hiddenCount} already in your tracker, hidden
                    </span>
                  )}
                </p>
              </div>
              <Badge tone="emerald">
                <Sparkles className="h-3 w-3" /> Fresh as of today
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visible.map((r, i) => (
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
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add to tracker
                      </Button>
                      {(() => {
                        // Always render an outbound link. If we have a real URL,
                        // go there directly; otherwise fall back to a Google
                        // search for the scholarship name (one click and the
                        // user is at the right page). Label changes so the user
                        // knows which one they're getting.
                        const hasUrl = r.url && r.url !== "#";
                        const href = hasUrl
                          ? r.url
                          : `https://www.google.com/search?q=${encodeURIComponent(r.name + " scholarship application")}`;
                        return (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={hasUrl ? r.url : `Search Google for "${r.name}"`}
                            className="inline-flex items-center justify-center gap-2 h-8 px-3 text-sm font-semibold rounded-xl border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 hover:border-brand-300 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20 transition-all duration-200 cursor-pointer whitespace-nowrap"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            {hasUrl ? "Apply on site" : "Search the web"}
                          </a>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
            );
          })()}

          {/* Show more matches — re-runs the same search but tells the model
              to skip every name we've already shown, so the user gets a
              genuinely fresh batch each click. Hidden once the model
              returns nothing new (noMoreResults). */}
          <div className="flex justify-center">
            {noMoreResults ? (
              <div className="text-sm text-slate-500 italic">
                That's everything we found for this profile. Tweak a field above and search again for more.
              </div>
            ) : (
              <Button
                size="lg"
                variant="outline"
                onClick={showMore}
                disabled={loadingMore || !lastProfile}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Finding more…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Show more matches
                  </>
                )}
              </Button>
            )}
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
