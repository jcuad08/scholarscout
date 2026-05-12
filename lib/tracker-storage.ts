"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Storage layer for the Tracker. Two backends:
 *   - localStorage  (anonymous / local-first mode)
 *   - Supabase     (authed mode, sync across devices)
 *
 * The Tracker component stays unaware of which backend is active — it just
 * calls these helpers. Backend selection happens at the call site based on
 * whether useAuth() returns a user.
 *
 * Truth model:
 *   - Logged out -> localStorage IS the truth.
 *   - Logged in  -> Supabase IS the truth. localStorage is ignored EXCEPT for
 *                   the one-time migration on first sign-in (any local rows
 *                   are uploaded then localStorage is cleared so it can't
 *                   diverge from cloud over time).
 */

import type { Row, WonLost } from "@/components/tracker-types";

const KEY_ROWS = "ss_rows";
const KEY_LOG = "ss_log";
const KEY_MATERIALS = "ss_materials";

/* ---------- localStorage ---------- */

export function loadLocalRows(): Row[] {
  try {
    const raw = localStorage.getItem(KEY_ROWS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
export function loadLocalLog(): WonLost[] {
  try {
    const raw = localStorage.getItem(KEY_LOG);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
export function loadLocalMaterials(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(KEY_MATERIALS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLocalRows(rows: Row[]): void {
  try {
    localStorage.setItem(KEY_ROWS, JSON.stringify(rows));
  } catch {}
}
export function saveLocalLog(log: WonLost[]): void {
  try {
    localStorage.setItem(KEY_LOG, JSON.stringify(log));
  } catch {}
}
export function saveLocalMaterials(materials: Record<string, boolean>): void {
  try {
    localStorage.setItem(KEY_MATERIALS, JSON.stringify(materials));
  } catch {}
}

export function clearLocal(): void {
  try {
    localStorage.removeItem(KEY_ROWS);
    localStorage.removeItem(KEY_LOG);
    localStorage.removeItem(KEY_MATERIALS);
  } catch {}
}

export function hasAnyLocal(): boolean {
  const rows = loadLocalRows();
  const log = loadLocalLog();
  const mats = loadLocalMaterials();
  return (
    rows.length > 0 ||
    log.length > 0 ||
    Object.values(mats).some(Boolean)
  );
}

/* ---------- Supabase ---------- */

type CloudSnapshot = {
  rows: Row[];
  log: WonLost[];
  materials: Record<string, boolean>;
};

export async function loadCloudSnapshot(
  sb: SupabaseClient,
  userId: string
): Promise<CloudSnapshot> {
  const [rowsRes, logRes, matsRes] = await Promise.all([
    sb.from("tracker_rows").select("*").eq("user_id", userId),
    sb.from("tracker_log").select("*").eq("user_id", userId),
    sb.from("tracker_materials").select("materials").eq("user_id", userId).maybeSingle(),
  ]);

  if (rowsRes.error) throw rowsRes.error;
  if (logRes.error) throw logRes.error;
  if (matsRes.error) throw matsRes.error;

  const rows: Row[] = (rowsRes.data || []).map((r) => ({
    id: r.id,
    name: r.name,
    award: r.award,
    deadline: r.deadline,
    status: r.status,
    submitted: r.submitted,
    notes: r.notes,
  })) as Row[];

  const log: WonLost[] = (logRes.data || []).map((l) => ({
    id: l.source_row_id ?? l.id,
    name: l.name,
    result: l.result,
    amount: l.amount,
    date: l.date,
  })) as WonLost[];

  const materials: Record<string, boolean> =
    (matsRes.data?.materials as Record<string, boolean> | undefined) ?? {};

  return { rows, log, materials };
}

/**
 * Full-state replace. Deletes any cloud rows whose IDs aren't in the new set,
 * then upserts all current rows. Simple, idempotent. Two queries instead of
 * a diff so we don't have to track add/update/delete events separately.
 */
export async function syncCloudRows(
  sb: SupabaseClient,
  userId: string,
  rows: Row[]
): Promise<void> {
  // Delete rows not in the current set
  const ids = rows.map((r) => r.id).filter(Boolean);
  if (ids.length > 0) {
    const { error } = await sb
      .from("tracker_rows")
      .delete()
      .eq("user_id", userId)
      .not("id", "in", `(${ids.map((id) => `"${id}"`).join(",")})`);
    if (error) throw error;
  } else {
    // No rows in state -> wipe all the user's cloud rows
    const { error } = await sb.from("tracker_rows").delete().eq("user_id", userId);
    if (error) throw error;
  }

  if (rows.length === 0) return;

  const payload = rows.map((r) => ({
    id: r.id,
    user_id: userId,
    name: r.name,
    award: r.award,
    deadline: r.deadline,
    status: r.status,
    submitted: r.submitted,
    notes: r.notes,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await sb.from("tracker_rows").upsert(payload, { onConflict: "id" });
  if (error) throw error;
}

export async function syncCloudLog(
  sb: SupabaseClient,
  userId: string,
  log: WonLost[]
): Promise<void> {
  // Wipe + reinsert is fine — log is small + append-only-ish
  const { error: delErr } = await sb.from("tracker_log").delete().eq("user_id", userId);
  if (delErr) throw delErr;

  if (log.length === 0) return;

  const payload = log.map((l) => ({
    user_id: userId,
    source_row_id: isUuid(l.id) ? l.id : null,
    name: l.name,
    result: l.result,
    amount: l.amount,
    date: l.date,
  }));
  const { error } = await sb.from("tracker_log").insert(payload);
  if (error) throw error;
}

export async function syncCloudMaterials(
  sb: SupabaseClient,
  userId: string,
  materials: Record<string, boolean>
): Promise<void> {
  const { error } = await sb.from("tracker_materials").upsert(
    { user_id: userId, materials, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
  if (error) throw error;
}

/**
 * One-shot migration on first sign-in: upload anything in localStorage to the
 * cloud, then clear localStorage so the two stores can't drift afterwards.
 * Skips rows whose names already exist in the cloud (case-insensitive).
 */
export async function migrateLocalToCloud(
  sb: SupabaseClient,
  userId: string,
  cloudExisting: CloudSnapshot
): Promise<{ migratedRows: number; migratedLog: number; migratedMaterials: boolean }> {
  const localRows = loadLocalRows();
  const localLog = loadLocalLog();
  const localMats = loadLocalMaterials();

  const cloudRowNames = new Set(cloudExisting.rows.map((r) => r.name.trim().toLowerCase()));

  // Only upload local rows whose names aren't already in cloud.
  const newRows = localRows.filter(
    (r) => !cloudRowNames.has(r.name.trim().toLowerCase())
  );

  if (newRows.length > 0) {
    const payload = newRows.map((r) => ({
      // Don't preserve local IDs — let Supabase generate fresh UUIDs
      // (local IDs may be the short Math.random uids, not real UUIDs).
      user_id: userId,
      name: r.name,
      award: r.award,
      deadline: r.deadline,
      status: r.status,
      submitted: r.submitted,
      notes: r.notes,
    }));
    const { error } = await sb.from("tracker_rows").insert(payload);
    if (error) throw error;
  }

  // Always append local log entries (deduping by name+result+date is overkill for v1)
  if (localLog.length > 0) {
    const payload = localLog.map((l) => ({
      user_id: userId,
      source_row_id: null, // local IDs aren't UUIDs, so we drop the link
      name: l.name,
      result: l.result,
      amount: l.amount,
      date: l.date,
    }));
    const { error } = await sb.from("tracker_log").insert(payload);
    if (error) throw error;
  }

  // Materials: merge cloud + local, with local winning on conflict.
  let migratedMaterials = false;
  if (Object.keys(localMats).length > 0) {
    const merged = { ...cloudExisting.materials, ...localMats };
    await syncCloudMaterials(sb, userId, merged);
    migratedMaterials = true;
  }

  // Done — clear local so we don't try to migrate again next sign-in.
  clearLocal();

  return {
    migratedRows: newRows.length,
    migratedLog: localLog.length,
    migratedMaterials,
  };
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
