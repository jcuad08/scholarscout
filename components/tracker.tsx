"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
  Badge,
  SectionHeading,
  Checkbox,
} from "./ui";
import {
  Plus,
  Trash2,
  Trophy,
  XCircle,
  ClipboardList,
  Folder,
  TrendingUp,
  DollarSign,
  Sparkles,
  RefreshCw,
  Loader2,
  ExternalLink,
  ArrowRight,
  Calendar,
  TrendingDown,
  Check,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mirrors the shape returned by /api/recommend-from-tracker.
type Recommendation = {
  name: string;
  amount: string;
  deadline: string;
  competition: "Very low" | "Low" | "Medium";
  match: number;
  tags: string[];
  why: string;
  url: string;
};

type Status =
  | "Not started"
  | "Researching"
  | "Gathering materials"
  | "Drafting essay"
  | "Ready to submit"
  | "Submitted"
  | "Won"
  | "Rejected";

const STATUSES: Status[] = [
  "Not started",
  "Researching",
  "Gathering materials",
  "Drafting essay",
  "Ready to submit",
  "Submitted",
  "Won",
  "Rejected",
];

type Row = {
  id: string;
  name: string;
  award: string;
  deadline: string;
  status: Status;
  submitted: string;
  notes: string;
};

type WonLost = { id: string; name: string; result: "Won" | "Rejected"; amount: string; date: string };

const MATERIALS = [
  "Resume (PDF)",
  "Unofficial transcript",
  "Official transcript (request 2 weeks ahead)",
  "Personal statement — entrepreneurship (500w)",
  "Personal statement — academic goals (500w)",
  "Letter of rec #1 (teacher/professor)",
  "Letter of rec #2 (mentor/employer)",
  "Headshot",
  "Portfolio link (artare.to)",
];

const statusTone: Record<Status, "slate" | "amber" | "violet" | "brand" | "emerald" | "rose"> = {
  "Not started": "slate",
  Researching: "slate",
  "Gathering materials": "violet",
  "Drafting essay": "amber",
  "Ready to submit": "brand",
  Submitted: "brand",
  Won: "emerald",
  Rejected: "rose",
};

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function Tracker() {
  // All three start empty so first-time visitors see a clean state, not seed data
  // pretending to be theirs. Hydration is safe — initial server-render and first
  // client-render both produce the empty state; localStorage is read in useEffect.
  const [rows, setRows] = useState<Row[]>([]);
  const [log, setLog] = useState<WonLost[]>([]);
  const [materials, setMaterials] = useState<Record<string, boolean>>({});
  // We only persist after the first hydration read — otherwise the empty initial
  // state would overwrite saved data on first mount.
  const [hydrated, setHydrated] = useState(false);

  // Read persisted state on mount and subscribe to the cross-component
  // "ss_rows_changed" event that Finder fires when adding to tracker.
  useEffect(() => {
    function loadFromStorage() {
      try {
        const r = localStorage.getItem("ss_rows");
        const l = localStorage.getItem("ss_log");
        const m = localStorage.getItem("ss_materials");
        if (r) setRows(JSON.parse(r));
        if (l) setLog(JSON.parse(l));
        if (m) setMaterials(JSON.parse(m));
      } catch {}
    }
    loadFromStorage();
    setHydrated(true);
    // Re-read when Finder pushes a row in. CustomEvent for same-tab sync;
    // 'storage' covers other tabs/windows of the same site.
    const onChange = () => loadFromStorage();
    window.addEventListener("ss_rows_changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("ss_rows_changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem("ss_rows", JSON.stringify(rows));
    } catch {}
  }, [rows, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem("ss_log", JSON.stringify(log));
    } catch {}
  }, [log, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem("ss_materials", JSON.stringify(materials));
    } catch {}
  }, [materials, hydrated]);

  function addRow() {
    setRows((r) => [
      ...r,
      {
        id: uid(),
        name: "",
        award: "",
        deadline: "",
        status: "Not started",
        submitted: "",
        notes: "",
      },
    ]);
  }

  function update(id: string, patch: Partial<Row>) {
    setRows((current) => {
      const before = current.find((row) => row.id === id);
      const next = current.map((row) => (row.id === id ? { ...row, ...patch } : row));
      // Side-effect: when status flips TO Won or Rejected, add a log entry —
      // unless we already have one for this row + result (idempotent on toggling
      // back and forth).
      if (
        before &&
        patch.status &&
        patch.status !== before.status &&
        (patch.status === "Won" || patch.status === "Rejected")
      ) {
        const result = patch.status;
        setLog((l) => {
          if (l.some((entry) => entry.id === id && entry.result === result)) return l;
          return [
            ...l,
            {
              id, // mirror the row id so we can dedupe
              name: before.name || "(unnamed scholarship)",
              result,
              amount: result === "Won" ? before.award || "—" : "—",
              date: new Date().toISOString().slice(0, 10),
            },
          ];
        });
      }
      return next;
    });
  }

  function remove(id: string) {
    setRows((r) => r.filter((row) => row.id !== id));
  }

  function removeLog(id: string, result: "Won" | "Rejected") {
    setLog((l) => l.filter((entry) => !(entry.id === id && entry.result === result)));
  }

  // Used by RecommendationsPanel to push a recommendation into the tracker.
  // We only get name/award/why from the recommendation — deadline is free-form
  // (e.g. "Rolling") so we leave the tracker's date input empty for the user
  // to fill in once they've checked the actual deadline themselves.
  function addRowFromRecommendation(input: { name: string; award: string; notes: string }) {
    setRows((r) => [
      ...r,
      {
        id: uid(),
        name: input.name,
        award: input.award,
        deadline: "",
        status: "Not started",
        submitted: "",
        notes: input.notes,
      },
    ]);
  }

  const submittedCount = rows.filter((r) => r.status === "Submitted" || r.status === "Won").length;
  const wonAmount = log
    .filter((l) => l.result === "Won")
    .reduce((sum, l) => sum + parseInt(l.amount.replace(/[^0-9]/g, "") || "0", 10), 0);
  const completedMaterials = Object.values(materials).filter(Boolean).length;

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Tracker"
        title="Your scholarship command center"
        description="Inspired by the template you already use. Saves locally — no account needed."
      />

      {/* Stats bento */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-brand-600 to-brand-500 text-white border-0">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-brand-100 text-xs uppercase tracking-wider font-semibold">
              <ClipboardList className="h-3.5 w-3.5" />
              Active
            </div>
            <div className="mt-1 font-display text-3xl font-bold">{rows.length}</div>
            <div className="text-xs text-brand-100 mt-1">in pipeline</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-wider font-semibold">
              <TrendingUp className="h-3.5 w-3.5" />
              Submitted
            </div>
            <div className="mt-1 font-display text-3xl font-bold text-slate-900 dark:text-slate-50">
              {submittedCount}
            </div>
            <div className="text-xs text-slate-500 mt-1">applications</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs uppercase tracking-wider font-semibold">
              <DollarSign className="h-3.5 w-3.5" />
              Won
            </div>
            <div className="mt-1 font-display text-3xl font-bold text-slate-900 dark:text-slate-50">
              ${wonAmount.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1">lifetime</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-wider font-semibold">
              <Folder className="h-3.5 w-3.5" />
              Materials
            </div>
            <div className="mt-1 font-display text-3xl font-bold text-slate-900 dark:text-slate-50">
              {completedMaterials}/{MATERIALS.length}
            </div>
            <div className="text-xs text-slate-500 mt-1">ready to reuse</div>
          </CardContent>
        </Card>
      </div>

      {/* Personalized recommendations from what's already in the tracker */}
      <RecommendationsPanel
        rows={rows}
        materials={materials}
        onAddRow={addRowFromRecommendation}
      />

      {/* Applications table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Active applications</CardTitle>
            <CardDescription>Click any cell to edit. Saves automatically.</CardDescription>
          </div>
          <Button onClick={addRow} size="sm">
            <Plus className="h-4 w-4" />
            Add scholarship
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm min-w-[820px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-2 py-2 font-semibold">Scholarship</th>
                  <th className="px-2 py-2 font-semibold">Award</th>
                  <th className="px-2 py-2 font-semibold">Deadline</th>
                  <th className="px-2 py-2 font-semibold">Status</th>
                  <th className="px-2 py-2 font-semibold">Submitted</th>
                  <th className="px-2 py-2 font-semibold">Notes</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-2 py-2">
                      <Input
                        value={row.name}
                        onChange={(e) => update(row.id, { name: e.target.value })}
                        placeholder="Scholarship name"
                        className="h-9 border-transparent bg-transparent hover:border-slate-200 dark:hover:border-slate-800"
                      />
                    </td>
                    <td className="px-2 py-2 w-28">
                      <Input
                        value={row.award}
                        onChange={(e) => update(row.id, { award: e.target.value })}
                        placeholder="$1,000"
                        className="h-9 border-transparent bg-transparent hover:border-slate-200 dark:hover:border-slate-800"
                      />
                    </td>
                    <td className="px-2 py-2 w-40">
                      <Input
                        type="date"
                        value={row.deadline}
                        onChange={(e) => update(row.id, { deadline: e.target.value })}
                        className="h-9 border-transparent bg-transparent hover:border-slate-200 dark:hover:border-slate-800"
                      />
                    </td>
                    <td className="px-2 py-2 w-48">
                      <Select
                        value={row.status}
                        onChange={(e) => update(row.id, { status: e.target.value as Status })}
                        className={cn("h-9 border-transparent bg-transparent hover:border-slate-200 dark:hover:border-slate-800")}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </Select>
                      <div className="px-1 pt-1">
                        <Badge tone={statusTone[row.status]}>{row.status}</Badge>
                      </div>
                    </td>
                    <td className="px-2 py-2 w-40">
                      <Input
                        type="date"
                        value={row.submitted}
                        onChange={(e) => update(row.id, { submitted: e.target.value })}
                        className="h-9 border-transparent bg-transparent hover:border-slate-200 dark:hover:border-slate-800"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        value={row.notes}
                        onChange={(e) => update(row.id, { notes: e.target.value })}
                        placeholder="Notes"
                        className="h-9 border-transparent bg-transparent hover:border-slate-200 dark:hover:border-slate-800"
                      />
                    </td>
                    <td className="px-2 py-2 w-10">
                      <button
                        onClick={() => remove(row.id)}
                        aria-label="Remove row"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-2 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-500">
                        <ClipboardList className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          No applications yet
                        </div>
                        <div className="text-xs text-slate-500 max-w-sm">
                          Click <span className="font-semibold">Add scholarship</span> above, or use{" "}
                          <span className="font-semibold">Add to tracker</span> on any Finder result.
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Won/Lost + Materials */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent-500" />
              Won / Lost log
            </CardTitle>
            <CardDescription>Celebrate the wins. Learn from the rest.</CardDescription>
          </CardHeader>
          <CardContent>
            {log.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center">
                <Trophy className="h-7 w-7 text-slate-300 dark:text-slate-700 mx-auto" />
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-2">
                  No results logged yet
                </div>
                <div className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Mark any active app as <span className="font-semibold">Won</span> or{" "}
                  <span className="font-semibold">Rejected</span> and it'll show up here.
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {log.map((l) => (
                  <div
                    key={`${l.id}:${l.result}`}
                    className="flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-800 group"
                  >
                    <div className="flex items-center gap-3">
                      {l.result === "Won" ? (
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                          <Trophy className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          <XCircle className="h-4 w-4" />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">{l.name}</div>
                        <div className="text-xs text-slate-500">{l.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <Badge tone={l.result === "Won" ? "emerald" : "rose"}>{l.result}</Badge>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">{l.amount}</div>
                      </div>
                      <button
                        onClick={() => removeLog(l.id, l.result)}
                        aria-label="Remove log entry"
                        className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-brand-600" />
              Reusable materials
            </CardTitle>
            <CardDescription>Keep these ready so you reuse them across every app.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MATERIALS.map((m) => (
                <Checkbox
                  key={m}
                  label={m}
                  checked={!!materials[m]}
                  onChange={(v) => setMaterials((s) => ({ ...s, [m]: v }))}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ---------- Recommendations panel ---------- */

type AddRowFromRec = (input: { name: string; award: string; notes: string }) => void;

function RecommendationsPanel({
  rows,
  materials,
  onAddRow,
}: {
  rows: Row[];
  materials: Record<string, boolean>;
  onAddRow: AddRowFromRec;
}) {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<number | null>(null);
  // Tracks recs the user has clicked Add on this session — purely UI feedback.
  // The cross-session source of truth is whether the name appears in `rows`.
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);

  // Names already in the tracker (case + whitespace insensitive) so we can
  // mark recs as "In tracker" without requiring an exact string match.
  const trackedNames = new Set(rows.map((r) => r.name.trim().toLowerCase()));

  // Load any cached recommendations on mount so the panel shows results
  // immediately on tab switch instead of re-fetching every time.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("ss_recs");
      if (raw) {
        const cached = JSON.parse(raw);
        if (Array.isArray(cached?.results)) {
          setRecs(cached.results);
          setGeneratedAt(typeof cached.generatedAt === "number" ? cached.generatedAt : null);
        }
      }
    } catch {}
    setHydrated(true);
  }, []);

  // Auto-fetch the first time the user has at least one row + no cached recs.
  // Subsequent rows-array changes do NOT auto-fetch (would burn API quota and
  // be annoying on every keystroke); user clicks Refresh instead.
  useEffect(() => {
    if (!hydrated) return;
    if (loading) return;
    if (recs.length > 0) return;
    if (rows.length === 0) return;
    fetchRecs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, rows.length === 0]);

  async function fetchRecs() {
    if (rows.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const enabledMaterials = Object.entries(materials)
        .filter(([, v]) => v)
        .map(([k]) => k);
      const res = await fetch("/api/recommend-from-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, materials: enabledMaterials }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      const results: Recommendation[] = Array.isArray(data.results) ? data.results : [];
      setRecs(results);
      const ts = Date.now();
      setGeneratedAt(ts);
      try {
        localStorage.setItem("ss_recs", JSON.stringify({ results, generatedAt: ts }));
      } catch {}
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't fetch recommendations");
    } finally {
      setLoading(false);
    }
  }

  function handleAdd(rec: Recommendation) {
    const norm = rec.name.trim().toLowerCase();
    if (added[rec.name] || trackedNames.has(norm)) return;
    onAddRow({ name: rec.name, award: rec.amount, notes: rec.why });
    setAdded((s) => ({ ...s, [rec.name]: true }));
  }

  // Empty-state: no rows yet, so no inference is possible.
  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent-500" />
            Recommended for you
          </CardTitle>
          <CardDescription>
            Add a few scholarships to your tracker and we'll suggest more like them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center">
            <Wand2 className="h-7 w-7 text-slate-300 dark:text-slate-700 mx-auto" />
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-2">
              Recommendations unlock once you have at least one scholarship in your tracker.
            </div>
            <div className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Use the Finder tab or click <span className="font-semibold">Add scholarship</span> below to start.
              The more scholarships you track, the more personalized your recommendations get.
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent-500" />
            Recommended for you
          </CardTitle>
          <CardDescription>
            Based on the {rows.length} {rows.length === 1 ? "scholarship" : "scholarships"} in your tracker.
            {generatedAt && (
              <span className="ml-1 text-slate-400">· Updated {formatRelativeTime(generatedAt)}</span>
            )}
          </CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={fetchRecs} disabled={loading}>
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {loading ? "Refreshing" : "Refresh"}
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200 mb-4">
            <span className="font-semibold">Couldn't fetch recommendations:</span> {error}
          </div>
        )}

        {loading && recs.length === 0 && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-10 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400 mx-auto" />
            <div className="text-sm text-slate-500 mt-2">Analyzing your tracker…</div>
          </div>
        )}

        {!loading && recs.length === 0 && !error && (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center">
            <div className="text-sm text-slate-500">No recommendations yet. Click Refresh to generate some.</div>
          </div>
        )}

        {recs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recs.map((r, i) => {
              const norm = r.name.trim().toLowerCase();
              const isAdded = added[r.name] || trackedNames.has(norm);
              const hasUrl = r.url && r.url !== "#";
              const href = hasUrl
                ? r.url
                : `https://www.google.com/search?q=${encodeURIComponent(r.name + " scholarship application")}`;
              return (
                <div
                  key={r.name}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:border-brand-300 dark:hover:border-brand-500/40 transition-colors animate-fade-in-up"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-display font-semibold text-sm text-slate-900 dark:text-slate-50 leading-snug">
                      {r.name}
                    </h4>
                    <div className="text-xs font-bold text-brand-600 dark:text-brand-400 shrink-0">
                      {r.match}%
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <DollarSign className="h-3 w-3" /> {r.amount}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {r.deadline}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <TrendingDown className="h-3 w-3 text-emerald-600" />
                      <span className="font-medium text-emerald-700 dark:text-emerald-400">
                        {r.competition}
                      </span>
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    <span className="font-semibold">Why:</span> {r.why}
                  </p>
                  {r.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {r.tags.slice(0, 3).map((t) => (
                        <Badge key={t} tone="slate">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleAdd(r)}
                      disabled={isAdded}
                      className={cn(isAdded && "opacity-60")}
                    >
                      {isAdded ? (
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
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
