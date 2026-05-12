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
  Badge,
  SectionHeading,
} from "./ui";
import {
  School,
  Loader2,
  GraduationCap,
  MapPin,
  Users,
  Building2,
  DollarSign,
  Calendar,
  ExternalLink,
} from "lucide-react";

type Institutional = {
  name: string;
  amount: string;
  deadline: string;
  type: "Merit" | "Departmental" | "Identity" | "Alumni" | "Honors" | "Athletic" | "Need-based" | "Local";
  desc: string;
  url: string;
};

type LocalAward = {
  name: string;
  amount: string;
  desc: string;
  url: string;
};

// Used only as a fallback if the API call fails before any results are loaded.
const FALLBACK_INSTITUTIONAL: Institutional[] = [
  {
    name: "Presidential Scholars Award",
    amount: "Full tuition",
    deadline: "Dec 1, 2026",
    type: "Merit",
    desc: "Top 5% of admitted freshmen. Auto-considered when you apply by the early deadline.",
    url: "",
  },
  {
    name: "First-Generation Pathway Grant",
    amount: "$8,000/yr",
    deadline: "Mar 1, 2027",
    type: "Identity",
    desc: "Requires 250-word essay. Renewable for 4 years if GPA ≥ 3.0.",
    url: "",
  },
  {
    name: "Departmental Scholarship",
    amount: "$3,500",
    deadline: "Feb 15, 2027",
    type: "Departmental",
    desc: "Apply directly through your major's department after admission. Most students don't know it exists.",
    url: "",
  },
  {
    name: "Alumni Legacy Award",
    amount: "$2,000",
    deadline: "Rolling",
    type: "Alumni",
    desc: "If any family member attended — even briefly — you may qualify. Check the alumni office.",
    url: "",
  },
];

const FALLBACK_LOCAL: LocalAward[] = [
  { name: "Town Chamber of Commerce Award", amount: "$1,000", desc: "For incoming freshmen at the local university.", url: "" },
  { name: "Campus Bookstore Textbook Grant", amount: "$500", desc: "Renewable. Apply at orientation.", url: "" },
  { name: "Greek Life Foundation", amount: "$1,500", desc: "For incoming freshmen who plan to rush.", url: "" },
];

export function SchoolResults() {
  const [school, setSchool] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [institutional, setInstitutional] = useState<Institutional[]>([]);
  const [aroundCampus, setAroundCampus] = useState<LocalAward[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!school.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/school-scholarships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ school }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      const inst: Institutional[] = Array.isArray(data.institutional) ? data.institutional : [];
      const local: LocalAward[] = Array.isArray(data.aroundCampus) ? data.aroundCampus : [];
      setInstitutional(inst.length > 0 ? inst : FALLBACK_INSTITUTIONAL);
      setAroundCampus(local.length > 0 ? local : FALLBACK_LOCAL);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setInstitutional(FALLBACK_INSTITUTIONAL);
      setAroundCampus(FALLBACK_LOCAL);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="School Matches"
        title="Scholarships tied to your college"
        description="Every school has institutional, departmental, and alumni-funded awards most students never apply for. Drop yours in."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="h-5 w-5 text-brand-600" />
            Where are you headed?
          </CardTitle>
          <CardDescription>
            Add the college you're attending (or considering). We'll pull institutional + nearby scholarships.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={search} className="flex flex-col sm:flex-row gap-3">
            <Input
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="e.g. University of California, Berkeley"
              className="flex-1 h-12 text-base"
            />
            <Button type="submit" size="lg" disabled={loading || !school.trim()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching…
                </>
              ) : (
                <>
                  <GraduationCap className="h-4 w-4" />
                  Find school scholarships
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {submitted && (
        <div className="space-y-6 animate-fade-in-up">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              <span className="font-semibold">Couldn't reach the model:</span> {error}. Showing example matches instead.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-brand-600 to-brand-500 text-white border-0">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-brand-100 text-sm">
                  <MapPin className="h-4 w-4" />
                  Your school
                </div>
                <div className="mt-1 font-display text-xl font-bold">{school}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Building2 className="h-4 w-4" />
                  Institutional awards
                </div>
                <div className="mt-1 font-display text-2xl font-bold text-slate-900 dark:text-slate-50">
                  {institutional.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Users className="h-4 w-4" />
                  Local + alumni
                </div>
                <div className="mt-1 font-display text-2xl font-bold text-slate-900 dark:text-slate-50">
                  {aroundCampus.length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Institutional scholarships</CardTitle>
              <CardDescription>Apply directly through the school's financial aid or department portal.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {institutional.map((r) => (
                  <div
                    key={r.name}
                    className="rounded-xl border border-slate-200 p-4 hover:border-brand-300 transition-colors dark:border-slate-800 dark:hover:border-brand-500/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{r.name}</div>
                      <Badge tone="violet">{r.type}</Badge>
                    </div>
                    <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{r.desc}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" /> {r.amount}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> {r.deadline}
                      </span>
                      {(() => {
                        // Same pattern as Finder: always render an outbound
                        // link, falling back to a Google search if no URL.
                        const hasUrl = !!r.url;
                        const href = hasUrl
                          ? r.url
                          : `https://www.google.com/search?q=${encodeURIComponent(r.name + " " + school + " scholarship")}`;
                        return (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={hasUrl ? r.url : `Search Google for "${r.name}"`}
                            className="ml-auto inline-flex items-center justify-center gap-1.5 h-8 px-3 text-sm font-semibold rounded-xl border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 hover:border-brand-300 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20 transition-all duration-200 cursor-pointer whitespace-nowrap"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {hasUrl ? "Apply on site" : "Search the web"}
                          </a>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Around campus</CardTitle>
              <CardDescription>Local businesses and orgs around your school often fund incoming students.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {aroundCampus.map((l) => (
                  <div
                    key={l.name}
                    className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 flex flex-col"
                  >
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{l.name}</div>
                    <div className="mt-0.5 text-xs text-accent-600 dark:text-accent-300 font-medium">{l.amount}</div>
                    <div className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 flex-1">{l.desc}</div>
                    {l.url ? (
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={l.url}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline self-start"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Apply on site
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-accent-50 border-accent-200 dark:bg-accent-500/10 dark:border-accent-500/30">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-500 text-white">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-slate-900 dark:text-slate-50">
                    Email the financial aid office today
                  </h4>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                    A 3-line email — "I'm an incoming freshman, what scholarships do you have that aren't on the website?"
                    — uncovers awards every year. Most students never ask.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
