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
} from "lucide-react";
import { cn } from "@/lib/utils";

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

const SEED: Row[] = [
  {
    id: "1",
    name: "Local Rotary Future Leaders",
    award: "$2,500",
    deadline: "2027-03-15",
    status: "Drafting essay",
    submitted: "",
    notes: "Need transcript",
  },
  {
    id: "2",
    name: "Doodle for Google",
    award: "$30,000",
    deadline: "2026-12-01",
    status: "Researching",
    submitted: "",
    notes: "Use Artare portfolio",
  },
  {
    id: "3",
    name: "Burger King Scholars",
    award: "$1,000",
    deadline: "2026-12-15",
    status: "Submitted",
    submitted: "2026-12-10",
    notes: "Confirmation email saved",
  },
];

type WonLost = { id: string; name: string; result: "Won" | "Rejected"; amount: string; date: string };

const SEED_LOG: WonLost[] = [
  { id: "a", name: "Elks Lodge Local Round", result: "Won", amount: "$500", date: "2026-04-12" },
  { id: "b", name: "Coca-Cola Scholars", result: "Rejected", amount: "—", date: "2026-03-01" },
];

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
  const [rows, setRows] = useState<Row[]>(SEED);
  const [log] = useState<WonLost[]>(SEED_LOG);
  const [materials, setMaterials] = useState<Record<string, boolean>>({});

  // Hydration safe: load any persisted state on mount only.
  useEffect(() => {
    try {
      const r = localStorage.getItem("ss_rows");
      const m = localStorage.getItem("ss_materials");
      if (r) setRows(JSON.parse(r));
      if (m) setMaterials(JSON.parse(m));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("ss_rows", JSON.stringify(rows));
    } catch {}
  }, [rows]);

  useEffect(() => {
    try {
      localStorage.setItem("ss_materials", JSON.stringify(materials));
    } catch {}
  }, [materials]);

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
    setRows((r) => r.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function remove(id: string) {
    setRows((r) => r.filter((row) => row.id !== id));
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
                    <td colSpan={7} className="px-2 py-10 text-center text-sm text-slate-500">
                      No applications yet. Click "Add scholarship" to start.
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
            <div className="space-y-2">
              {log.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-800"
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
                  <div className="text-right">
                    <Badge tone={l.result === "Won" ? "emerald" : "rose"}>{l.result}</Badge>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">{l.amount}</div>
                  </div>
                </div>
              ))}
            </div>
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
