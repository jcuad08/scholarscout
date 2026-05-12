"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "./auth-context";
import { getSupabase } from "./supabase";
import {
  loadLocalRows,
  loadLocalLog,
  loadLocalMaterials,
  saveLocalRows,
  saveLocalLog,
  saveLocalMaterials,
  loadCloudSnapshot,
  syncCloudRows,
  syncCloudLog,
  syncCloudMaterials,
  migrateLocalToCloud,
  hasAnyLocal,
} from "./tracker-storage";
import type { Row, WonLost, Status } from "@/components/tracker-types";

/**
 * Shared tracker state for the whole app.
 *
 * Why a context: Tracker, Finder, RecommendationsPanel all need to know what's
 * already tracked (for dedup + filter) and want a single addRow() entry point
 * so duplicates can't sneak in. Centralizing here also moves the dual-mode
 * (localStorage <-> Supabase) persistence out of the Tracker component into
 * a single place that can't drift between consumers.
 *
 * Truth model: same as before. Logged out -> localStorage; logged in ->
 * Supabase, with one-shot migration of any local data on first sign-in.
 */

const COMPLETED_STATUSES = new Set<Status>(["Won", "Rejected"]);

export type AddRowResult =
  | { added: true; row: Row }
  | { added: false; reason: "duplicate-active" | "duplicate-completed"; existing: Row };

type TrackerContextValue = {
  ready: boolean;
  syncing: boolean;
  rows: Row[];
  log: WonLost[];
  materials: Record<string, boolean>;
  /** Names already in the tracker (active OR completed), normalized to
   *  lowercase + trimmed. Use this to dedupe / filter from anywhere. */
  trackedNames: Set<string>;
  /** A one-shot toast string set after a localStorage->cloud migration on
   *  first sign-in. Components can render + then call dismissMigrationToast. */
  migrationToast: string | null;
  dismissMigrationToast: () => void;

  /** Centralized add. Refuses to insert a row whose normalized name already
   *  exists in the tracker — so Finder, Recs, and any future caller can't
   *  create duplicates. Returns the existing row when refusing so the caller
   *  can surface a useful "Already in tracker" message. */
  addRow: (input: { name: string; award?: string; deadline?: string; notes?: string }) => AddRowResult;
  /** For the manual "Add scholarship" button in Tracker — creates an empty
   *  row that the user will fill in. Skips the duplicate check (the row has
   *  no name yet to collide with anything). */
  addBlankRow: () => Row;
  updateRow: (id: string, patch: Partial<Row>) => void;
  removeRow: (id: string) => void;
  /** Move a Won/Rejected row back to active (status -> Not started). */
  reactivateRow: (id: string) => void;

  setMaterials: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  removeLogEntry: (id: string, result: "Won" | "Rejected") => void;
};

const Ctx = createContext<TrackerContextValue | null>(null);

function uid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function norm(name: string): string {
  return name.trim().toLowerCase();
}

export function TrackerProvider({ children }: { children: React.ReactNode }) {
  const { ready: authReady, user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [log, setLog] = useState<WonLost[]>([]);
  const [materials, setMaterials] = useState<Record<string, boolean>>({});
  const [ready, setReady] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [migrationToast, setMigrationToast] = useState<string | null>(null);
  // Tracks which user (or "local") the current in-memory state belongs to.
  // Prevents writing the previous user's data to the new account on sign-in.
  const stateOwner = useRef<string | null>(null);

  // ---------- Initial load + reload on auth-state-change ----------
  useEffect(() => {
    if (!authReady) return;
    const owner = user?.id ?? "local";
    if (stateOwner.current === owner) return;

    let cancelled = false;
    setReady(false);

    (async () => {
      try {
        if (user) {
          const sb = getSupabase();
          const cloud = await loadCloudSnapshot(sb, user.id);

          let nextRows = cloud.rows;
          let nextLog = cloud.log;
          let nextMaterials = cloud.materials;

          if (hasAnyLocal()) {
            const result = await migrateLocalToCloud(sb, user.id, cloud);
            const after = await loadCloudSnapshot(sb, user.id);
            nextRows = after.rows;
            nextLog = after.log;
            nextMaterials = after.materials;

            const summary: string[] = [];
            if (result.migratedRows > 0) summary.push(`${result.migratedRows} scholarships`);
            if (result.migratedLog > 0) summary.push(`${result.migratedLog} log entries`);
            if (result.migratedMaterials) summary.push("materials checklist");
            if (summary.length > 0) {
              setMigrationToast(`Synced ${summary.join(", ")} from this device to your account.`);
            }
          }

          if (!cancelled) {
            setRows(nextRows);
            setLog(nextLog);
            setMaterials(nextMaterials);
          }
        } else {
          if (!cancelled) {
            setRows(loadLocalRows());
            setLog(loadLocalLog());
            setMaterials(loadLocalMaterials());
          }
        }
        if (!cancelled) {
          stateOwner.current = owner;
          setReady(true);
        }
      } catch (err) {
        console.error("[TrackerProvider] load failed", err);
        if (!cancelled) {
          setRows(loadLocalRows());
          setLog(loadLocalLog());
          setMaterials(loadLocalMaterials());
          stateOwner.current = owner;
          setReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady, user]);

  // ---------- Cross-tab / cross-window sync (only meaningful when local) ----------
  useEffect(() => {
    if (user) return;
    function reload() {
      setRows(loadLocalRows());
      setLog(loadLocalLog());
      setMaterials(loadLocalMaterials());
    }
    window.addEventListener("ss_rows_changed", reload);
    window.addEventListener("storage", reload);
    return () => {
      window.removeEventListener("ss_rows_changed", reload);
      window.removeEventListener("storage", reload);
    };
  }, [user]);

  // ---------- Persistence (debounced 600ms when cloud) ----------
  useEffect(() => {
    if (!ready) return;
    if (user) {
      setSyncing(true);
      const t = setTimeout(() => {
        syncCloudRows(getSupabase(), user.id, rows)
          .catch((e) => console.error("[TrackerProvider] sync rows failed", e))
          .finally(() => setSyncing(false));
      }, 600);
      return () => clearTimeout(t);
    } else {
      saveLocalRows(rows);
    }
  }, [rows, user, ready]);

  useEffect(() => {
    if (!ready) return;
    if (user) {
      const t = setTimeout(() => {
        syncCloudLog(getSupabase(), user.id, log).catch((e) =>
          console.error("[TrackerProvider] sync log failed", e)
        );
      }, 600);
      return () => clearTimeout(t);
    } else {
      saveLocalLog(log);
    }
  }, [log, user, ready]);

  useEffect(() => {
    if (!ready) return;
    if (user) {
      const t = setTimeout(() => {
        syncCloudMaterials(getSupabase(), user.id, materials).catch((e) =>
          console.error("[TrackerProvider] sync materials failed", e)
        );
      }, 600);
      return () => clearTimeout(t);
    } else {
      saveLocalMaterials(materials);
    }
  }, [materials, user, ready]);

  // ---------- Derived: normalized name set for fast dedup/filter ----------
  const trackedNames = useMemo(
    () => new Set(rows.map((r) => norm(r.name)).filter(Boolean)),
    [rows]
  );

  // ---------- Mutators ----------
  const addRow = useCallback<TrackerContextValue["addRow"]>(
    (input) => {
      const normalized = norm(input.name);
      const existing = rows.find((r) => norm(r.name) === normalized && normalized.length > 0);
      if (existing) {
        const reason = COMPLETED_STATUSES.has(existing.status)
          ? "duplicate-completed"
          : "duplicate-active";
        return { added: false, reason, existing };
      }
      const newRow: Row = {
        id: uid(),
        name: input.name,
        award: input.award ?? "",
        deadline: input.deadline ?? "",
        status: "Not started",
        submitted: "",
        notes: input.notes ?? "",
      };
      setRows((r) => [...r, newRow]);
      return { added: true, row: newRow };
    },
    [rows]
  );

  const addBlankRow = useCallback<TrackerContextValue["addBlankRow"]>(() => {
    const blank: Row = {
      id: uid(),
      name: "",
      award: "",
      deadline: "",
      status: "Not started",
      submitted: "",
      notes: "",
    };
    setRows((r) => [...r, blank]);
    return blank;
  }, []);

  const updateRow = useCallback<TrackerContextValue["updateRow"]>((id, patch) => {
    setRows((current) => {
      const before = current.find((row) => row.id === id);
      const next = current.map((row) => (row.id === id ? { ...row, ...patch } : row));
      // Auto-log on status flip TO Won/Rejected (idempotent on re-toggle).
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
              id,
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
  }, []);

  const removeRow = useCallback<TrackerContextValue["removeRow"]>((id) => {
    setRows((r) => r.filter((row) => row.id !== id));
  }, []);

  const reactivateRow = useCallback<TrackerContextValue["reactivateRow"]>((id) => {
    setRows((r) =>
      r.map((row) => (row.id === id ? { ...row, status: "Not started" as Status } : row))
    );
  }, []);

  const removeLogEntry = useCallback<TrackerContextValue["removeLogEntry"]>(
    (id, result) => {
      setLog((l) => l.filter((entry) => !(entry.id === id && entry.result === result)));
    },
    []
  );

  const dismissMigrationToast = useCallback(() => setMigrationToast(null), []);

  const value: TrackerContextValue = {
    ready,
    syncing,
    rows,
    log,
    materials,
    trackedNames,
    migrationToast,
    dismissMigrationToast,
    addRow,
    addBlankRow,
    updateRow,
    removeRow,
    reactivateRow,
    setMaterials,
    removeLogEntry,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTracker(): TrackerContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTracker must be used inside <TrackerProvider>");
  return ctx;
}

/** Helper: split rows into active (status not Won/Rejected) vs completed. */
export function splitByCompletion(rows: Row[]): { active: Row[]; completed: Row[] } {
  const active: Row[] = [];
  const completed: Row[] = [];
  for (const r of rows) {
    if (COMPLETED_STATUSES.has(r.status)) completed.push(r);
    else active.push(r);
  }
  return { active, completed };
}
