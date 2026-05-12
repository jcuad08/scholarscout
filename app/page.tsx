"use client";

import { useState } from "react";
import {
  Search,
  Wand2,
  Lightbulb,
  School,
  ListChecks,
  GraduationCap,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Compass,
  Wallet,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Finder } from "@/components/finder";
import { ApplyHelper } from "@/components/apply-helper";
import { TipsHub } from "@/components/tips-hub";
import { SchoolResults } from "@/components/school-results";
import { Tracker } from "@/components/tracker";
import { Button, Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";

type TabId = "home" | "finder" | "apply" | "tips" | "school" | "tracker";

const TABS: { id: TabId; label: string; icon: typeof Search }[] = [
  { id: "home", label: "Home", icon: Sparkles },
  { id: "finder", label: "Finder", icon: Search },
  { id: "apply", label: "Apply Helper", icon: Wand2 },
  { id: "tips", label: "Tips Hub", icon: Lightbulb },
  { id: "school", label: "School", icon: School },
  { id: "tracker", label: "Tracker", icon: ListChecks },
];

export default function Page() {
  const [tab, setTab] = useState<TabId>("home");
  // Cross-tab handoff: when Finder's "Apply guide" button is clicked we set
  // a preset scholarship name and switch tabs. ApplyHelper picks it up as a prop.
  const [presetScholarship, setPresetScholarship] = useState<string>("");

  function goToApplyWith(name: string) {
    setPresetScholarship(name);
    setTab("apply");
  }

  return (
    <div className="min-h-screen">
      {/* Decorative gradient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-brand-300/30 blur-3xl dark:bg-brand-600/10" />
        <div className="absolute top-40 -right-40 h-[500px] w-[500px] rounded-full bg-accent-200/40 blur-3xl dark:bg-accent-500/10" />
        <div className="absolute inset-0 bg-grid-light dark:bg-grid-dark bg-[size:40px_40px] opacity-50" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-slate-50/70 dark:bg-slate-950/70 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <button
            onClick={() => setTab("home")}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 text-white shadow-sm group-hover:shadow-md transition-shadow">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="font-display font-bold text-slate-900 dark:text-slate-50 leading-tight">
                ScholarScout
              </div>
              <div className="text-[11px] text-slate-500 leading-tight">Find. Apply. Win.</div>
            </div>
          </button>

          {/* Desktop tabs */}
          <nav className="hidden lg:flex items-center gap-1 rounded-xl bg-white/60 p-1 border border-slate-200/80 dark:bg-slate-900/60 dark:border-slate-800/80">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                    active
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </nav>

          <ThemeToggle />
        </div>

        {/* Mobile tabs */}
        <nav className="lg:hidden border-t border-slate-200/60 dark:border-slate-800/60 overflow-x-auto">
          <div className="flex gap-1 px-3 py-2 min-w-max">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap",
                    active
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/*
        Main content. We render every tab and toggle visibility instead of
        unmounting — that way Finder results, the school search, and the
        ApplyHelper draft all survive when the user navigates away and back.
        The HTML `hidden` attribute is `display: none` and accessibility-safe.
      */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div hidden={tab !== "home"}>
          <Home goTo={setTab} />
        </div>
        <div hidden={tab !== "finder"}>
          <Finder onApplyGuide={goToApplyWith} />
        </div>
        <div hidden={tab !== "apply"}>
          <ApplyHelper preset={presetScholarship} />
        </div>
        <div hidden={tab !== "tips"}>
          <TipsHub />
        </div>
        <div hidden={tab !== "school"}>
          <SchoolResults />
        </div>
        <div hidden={tab !== "tracker"}>
          <Tracker />
        </div>
      </main>

      <footer className="border-t border-slate-200/60 dark:border-slate-800/60 mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-sm text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            ScholarScout — built for incoming freshmen who want odds on their side.
          </div>
          <div>Free. No account required. Local-first.</div>
        </div>
      </footer>
    </div>
  );
}

/* ---------- Home / Hero / Bento ---------- */

function Home({ goTo }: { goTo: (t: TabId) => void }) {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative pt-4 sm:pt-8">
        <div className="max-w-3xl animate-fade-in-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50/80 px-3 py-1 text-xs font-medium text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300">
            <Sparkles className="h-3.5 w-3.5" />
            Built for incoming college freshmen
          </div>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 leading-[1.05]">
            Find scholarships{" "}
            <span className="bg-gradient-to-br from-brand-600 to-accent-500 bg-clip-text text-transparent">
              everyone else misses.
            </span>
          </h1>
          <p className="mt-5 text-lg text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            ScholarScout searches beyond the famous-50 list — local clubs, niche orgs, your future
            college, your hobbies — to surface low-competition awards with the best dollar-per-effort
            ratio.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={() => goTo("finder")}>
              <Search className="h-4 w-4" />
              Find my scholarships
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => goTo("tips")}>
              <Lightbulb className="h-4 w-4" />
              See where money hides
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Free forever
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              No login required
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Saves to your device
            </span>
          </div>
        </div>
      </section>

      {/* Bento grid */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-[180px]">
          {/* Finder — big */}
          <BentoCard
            onClick={() => goTo("finder")}
            className="md:col-span-4 md:row-span-2 bg-gradient-to-br from-brand-600 via-brand-500 to-brand-400 text-white border-0"
          >
            <div className="flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center gap-2 text-brand-100 text-sm">
                  <Search className="h-4 w-4" />
                  Scholarship Finder
                </div>
                <h3 className="mt-2 font-display text-2xl sm:text-3xl font-bold leading-tight">
                  Tell us about you. Get matches sorted by lowest competition.
                </h3>
                <p className="mt-3 text-brand-100 max-w-md text-sm sm:text-base">
                  GPA, major, hobbies, state — most fields optional. We surface niche awards over
                  the famous ones every student applies to.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium opacity-90 group-hover:opacity-100 transition-opacity">
                Start a search <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </BentoCard>

          {/* Tracker stat */}
          <BentoCard
            onClick={() => goTo("tracker")}
            className="md:col-span-2 bg-white dark:bg-slate-900"
          >
            <div className="flex flex-col h-full justify-between">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <ListChecks className="h-4 w-4" />
                Tracker
              </div>
              <div>
                <div className="font-display text-3xl font-bold text-slate-900 dark:text-slate-50">
                  Stay on top of every app
                </div>
                <div className="text-sm text-slate-500 mt-1">Tables. Status. Wins. All local.</div>
              </div>
            </div>
          </BentoCard>

          {/* Apply helper */}
          <BentoCard
            onClick={() => goTo("apply")}
            className="md:col-span-2 bg-gradient-to-br from-accent-400 to-accent-500 text-white border-0"
          >
            <div className="flex flex-col h-full justify-between">
              <div className="flex items-center gap-2 text-amber-50 text-sm">
                <Wand2 className="h-4 w-4" />
                Apply Helper
              </div>
              <div>
                <div className="font-display text-2xl font-bold leading-tight">
                  Drop in a scholarship. Get a custom guide + essay coach.
                </div>
              </div>
            </div>
          </BentoCard>

          {/* Tips */}
          <BentoCard
            onClick={() => goTo("tips")}
            className="md:col-span-2 bg-white dark:bg-slate-900"
          >
            <div className="flex flex-col h-full justify-between">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Compass className="h-4 w-4" />
                Tips Hub
              </div>
              <div>
                <div className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">
                  8 places students forget to look
                </div>
                <div className="text-sm text-slate-500 mt-1">Civic clubs, employers, niche orgs, more.</div>
              </div>
            </div>
          </BentoCard>

          {/* School */}
          <BentoCard
            onClick={() => goTo("school")}
            className="md:col-span-2 bg-white dark:bg-slate-900"
          >
            <div className="flex flex-col h-full justify-between">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <School className="h-4 w-4" />
                School Matches
              </div>
              <div>
                <div className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">
                  Awards tied to your college
                </div>
                <div className="text-sm text-slate-500 mt-1">Institutional + alumni + nearby.</div>
              </div>
            </div>
          </BentoCard>
        </div>
      </section>

      {/* Why it works */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display font-semibold text-slate-900 dark:text-slate-50">
                Better odds, not bigger lists
              </h3>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                We rank for award-to-applicant ratio. A $1,000 local Rotary award with 12 applicants
                beats a $20,000 national with 50,000.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600 dark:bg-accent-500/10 dark:text-accent-300">
                <Wallet className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display font-semibold text-slate-900 dark:text-slate-50">
                Stack the quick wins
              </h3>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Small awards compound. Five $500 wins = $2,500 — usually less work than one big essay
                you might not finish.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <Compass className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display font-semibold text-slate-900 dark:text-slate-50">
                A method, not just a list
              </h3>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Every result comes with a step-by-step path: where to apply, what to write, when to
                submit. So you actually do it.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function BentoCard({
  className,
  children,
  onClick,
}: {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group rounded-2xl border border-slate-200 dark:border-slate-800 p-5 text-left cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-950",
        className
      )}
    >
      {children}
    </button>
  );
}
