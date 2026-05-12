"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  SectionHeading,
} from "./ui";
import {
  Building2,
  GraduationCap,
  Church,
  Users,
  Briefcase,
  HeartHandshake,
  Library,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Source = {
  icon: LucideIcon;
  title: string;
  effort: "Low" | "Medium";
  desc: string;
  examples: string[];
  how: string;
  tone: "brand" | "amber" | "emerald" | "violet" | "rose";
};

const SOURCES: Source[] = [
  {
    icon: Building2,
    title: "Local businesses",
    effort: "Low",
    desc: "Banks, car dealerships, supermarkets, and local restaurants often fund 1–2 scholarships/year that nobody hears about.",
    examples: ["Local credit unions", "Family-owned restaurants", "Insurance agencies", "Hardware stores"],
    how: "Walk in and ask the manager. Seriously. Or call once and ask 'do you have a community scholarship?'",
    tone: "brand",
  },
  {
    icon: Users,
    title: "Civic clubs",
    effort: "Low",
    desc: "Rotary, Lions, Kiwanis, Elks, JCI, Moose, American Legion. Almost every chapter funds students.",
    examples: ["Rotary Club", "Lions Club", "Kiwanis", "Elks Lodge", "VFW (military families)"],
    how: "Search '[your city] + [club name] scholarship'. Many require a member to sponsor — ask your counselor.",
    tone: "amber",
  },
  {
    icon: GraduationCap,
    title: "Your high school + college",
    effort: "Low",
    desc: "Counselor's office has a folder most students never open. Plus your future college's financial aid page.",
    examples: ["HS counselor scholarship list", "College financial aid office", "Departmental awards", "Alumni scholarships"],
    how: "Email your counselor and your future college's financial aid office in the same week. Ask for any niche/departmental awards.",
    tone: "emerald",
  },
  {
    icon: Church,
    title: "Religious & cultural orgs",
    effort: "Low",
    desc: "Even if you're not actively practicing, family heritage often qualifies. Tiny applicant pools.",
    examples: ["Knights of Columbus", "Hellenic societies", "Hispanic Heritage Foundation", "Local mosques/temples"],
    how: "Ask family elders what cultural/religious orgs they belong to. Awards often go unclaimed.",
    tone: "violet",
  },
  {
    icon: Briefcase,
    title: "Parents' employers + unions",
    effort: "Low",
    desc: "Most large employers offer dependent scholarships. Most parents forget to mention it.",
    examples: ["Corporate HR scholarships", "Union education funds", "Trade association awards"],
    how: "Have a parent search their HR portal for 'scholarship' or 'tuition'. Unions almost always have funds.",
    tone: "brand",
  },
  {
    icon: HeartHandshake,
    title: "Hobby / identity orgs",
    effort: "Medium",
    desc: "The niche-er, the better. Left-handed students, vegetarians, twins, ham radio operators — all have real awards.",
    examples: ["Vegetarian Resource Group", "Tall Clubs International", "Stuck at Prom (duct tape!)", "National Beef Ambassador"],
    how: "Google '[your weird trait] scholarship'. Be specific and unembarrassed.",
    tone: "amber",
  },
  {
    icon: Trophy,
    title: "Competitions with cash prizes",
    effort: "Medium",
    desc: "Treat contests like scholarships. Writing, video, design, STEM fairs — all stackable on apps.",
    examples: ["Scholastic Art & Writing", "Doodle for Google", "MIT THINK", "Regeneron STS"],
    how: "Pick one per quarter. Even runner-up cash adds up.",
    tone: "rose",
  },
  {
    icon: Library,
    title: "Community foundations",
    effort: "Low",
    desc: "Every region has one. They administer dozens of small donor-funded awards in a single application.",
    examples: ["[City] Community Foundation", "[County] Education Foundation"],
    how: "Search 'community foundation [your county]'. One app → ~10–30 awards considered.",
    tone: "emerald",
  },
];

const RED_FLAGS = [
  "Application fees of any kind — real scholarships never charge.",
  "'Guaranteed' scholarships or 'unclaimed money' pitches.",
  "Asking for bank info, SSN, or payment to 'process' an award.",
  "Pressure to 'apply now' on an unfamiliar site.",
  "Vague essay prompts on a site with no organization listed.",
];

const FREQUENCY = [
  { when: "Daily (5 min)", what: "Check 1 newsletter or aggregator. Star anything worth applying to." },
  { when: "Weekly (90 min)", what: "Apply to 2–3 short scholarships. No essays needed week 1." },
  { when: "Monthly", what: "Email 1 local business or club asking about scholarships." },
  { when: "Each semester", what: "Re-check your college + counselor's portal for new awards." },
];

export function TipsHub() {
  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Tips Hub"
        title="Where the money actually hides"
        description="Most students apply to the same 5 famous scholarships. Here are the under-the-radar sources with way better odds."
      />

      {/* Sources bento */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {SOURCES.map((s, i) => {
          const Icon = s.icon;
          return (
            <Card
              key={s.title}
              className="hover:border-brand-300 dark:hover:border-brand-500/40 transition-colors animate-fade-in-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10">
                    <Icon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <Badge tone={s.effort === "Low" ? "emerald" : "amber"}>{s.effort} effort</Badge>
                </div>
                <div>
                  <h4 className="font-display font-semibold text-slate-900 dark:text-slate-50">{s.title}</h4>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1.5">
                    Examples
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {s.examples.map((e) => (
                      <Badge key={e} tone="slate">{e}</Badge>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950/50">
                  <div className="flex items-start gap-2 text-sm">
                    <Lightbulb className="h-4 w-4 shrink-0 text-accent-500 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300"><span className="font-semibold">How:</span> {s.how}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Cadence + Red flags */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              How often to check
            </CardTitle>
            <CardDescription>The students who win the most apply on a schedule — not in bursts.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {FREQUENCY.map((f) => (
                <li key={f.when} className="flex gap-3 items-start rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="w-32 shrink-0">
                    <Badge tone="brand">{f.when}</Badge>
                  </div>
                  <div className="text-sm text-slate-700 dark:text-slate-300">{f.what}</div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-rose-200 bg-rose-50/50 dark:border-rose-500/20 dark:bg-rose-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              Scholarship scam red flags
            </CardTitle>
            <CardDescription>If you see any of these — close the tab.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {RED_FLAGS.map((f) => (
                <li key={f} className="flex gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <span className="text-rose-500 font-bold">✗</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
