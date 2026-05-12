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

const SCHOOL_RESULTS = [
  {
    name: "Presidential Scholars Award",
    amount: "Full tuition",
    deadline: "Dec 1, 2026",
    type: "Merit",
    desc: "Top 5% of admitted freshmen. Auto-considered when you apply by the early deadline.",
  },
  {
    name: "First-Generation Pathway Grant",
    amount: "$8,000/yr",
    deadline: "Mar 1, 2027",
    type: "Identity",
    desc: "Requires 250-word essay. Renewable for 4 years if GPA ≥ 3.0.",
  },
  {
    name: "Department of Computer Science Scholarship",
    amount: "$3,500",
    deadline: "Feb 15, 2027",
    type: "Departmental",
    desc: "Apply directly through the CS department after admission. Most students don't know it exists.",
  },
  {
    name: "Alumni Legacy Award",
    amount: "$2,000",
    deadline: "Rolling",
    type: "Alumni",
    desc: "If any family member attended — even briefly — you may qualify. Check the alumni office.",
  },
  {
    name: "Honors College Stipend",
    amount: "$1,500/semester",
    deadline: "After admission",
    type: "Honors",
    desc: "Automatic with Honors College admission. Stackable with other awards.",
  },
  {
    name: "Diversity in Engineering Award",
    amount: "$5,000",
    deadline: "Apr 15, 2027",
    type: "Identity",
    desc: "Underrepresented students in engineering. Short essay + faculty rec.",
  },
];

const LOCAL_AROUND_SCHOOL = [
  { name: "Town Chamber of Commerce Award", amount: "$1,000", desc: "For incoming freshmen at the local university." },
  { name: "Campus Bookstore Textbook Grant", amount: "$500", desc: "Renewable. Apply at orientation." },
  { name: "Greek Life Foundation", amount: "$1,500", desc: "For incoming freshmen who plan to rush." },
];

export function SchoolResults() {
  const [school, setSchool] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function search(e: React.FormEvent) {
    e.preventDefault();
    if (!school.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 700);
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
                  {SCHOOL_RESULTS.length}
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
                  {LOCAL_AROUND_SCHOOL.length}
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
                {SCHOOL_RESULTS.map((r) => (
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
                      <Button size="sm" variant="outline" className="ml-auto">
                        <ExternalLink className="h-3 w-3" />
                        Details
                      </Button>
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
                {LOCAL_AROUND_SCHOOL.map((l) => (
                  <div
                    key={l.name}
                    className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                  >
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{l.name}</div>
                    <div className="mt-0.5 text-xs text-accent-600 dark:text-accent-300 font-medium">{l.amount}</div>
                    <div className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{l.desc}</div>
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
