"use client";

import type { Row, WonLost } from "@/components/tracker-types";

/**
 * Generate an .xlsx file from the user's current tracker state and trigger a
 * browser download. Three sheets:
 *
 *   1. Active — every row whose status is NOT Won/Rejected
 *   2. Completed — every row whose status IS Won or Rejected
 *   3. Materials — the reusable-materials checklist with ready/not-ready
 *
 * exceljs is loaded via dynamic import so it doesn't bloat the initial JS
 * bundle (~700 KB compressed). The user only pays the cost the moment they
 * click Export.
 */

const COMPLETED_STATUSES = new Set<string>(["Won", "Rejected"]);

export async function exportTrackerToXlsx({
  rows,
  log,
  materials,
}: {
  rows: Row[];
  log: WonLost[];
  materials: Record<string, boolean>;
}): Promise<void> {
  // Lazy-loaded so initial page bundles don't grow by ~700 KB for a feature
  // most users will rarely click.
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ScholarScout";
  workbook.created = new Date();

  const active = rows.filter((r) => !COMPLETED_STATUSES.has(r.status));
  const completed = rows.filter((r) => COMPLETED_STATUSES.has(r.status));

  const headerStyle = {
    font: { bold: true, color: { argb: "FFFFFFFF" } },
    fill: {
      type: "pattern" as const,
      pattern: "solid" as const,
      fgColor: { argb: "FF4F46E5" }, // brand-600
    },
    alignment: { vertical: "middle" as const },
  };

  /* ---------- Sheet 1: Active ---------- */
  const activeSheet = workbook.addWorksheet("Active", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  activeSheet.columns = [
    { header: "Scholarship", key: "name", width: 38 },
    { header: "Award", key: "award", width: 16 },
    { header: "Deadline", key: "deadline", width: 14 },
    { header: "Status", key: "status", width: 22 },
    { header: "Submitted on", key: "submitted", width: 14 },
    { header: "Notes", key: "notes", width: 50 },
  ];
  Object.assign(activeSheet.getRow(1), headerStyle);
  activeSheet.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));
  for (const r of active) {
    activeSheet.addRow({
      name: r.name,
      award: r.award,
      deadline: r.deadline,
      status: r.status,
      submitted: r.submitted,
      notes: r.notes,
    });
  }
  // Wrap notes column so long text is readable on screen + print.
  activeSheet.getColumn("notes").alignment = { wrapText: true, vertical: "top" };

  /* ---------- Sheet 2: Completed ---------- */
  const completedSheet = workbook.addWorksheet("Completed", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  completedSheet.columns = [
    { header: "Scholarship", key: "name", width: 38 },
    { header: "Award", key: "award", width: 16 },
    { header: "Result", key: "status", width: 14 },
    { header: "Submitted on", key: "submitted", width: 14 },
    { header: "Notes", key: "notes", width: 50 },
  ];
  completedSheet.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));
  for (const r of completed) {
    completedSheet.addRow({
      name: r.name,
      award: r.award,
      status: r.status,
      submitted: r.submitted,
      notes: r.notes,
    });
  }
  completedSheet.getColumn("notes").alignment = { wrapText: true, vertical: "top" };

  // If there are also log entries that don't correspond to current rows
  // (e.g. row deleted but log kept), append them so the lifetime record is
  // complete.
  const completedNames = new Set(completed.map((r) => r.name.trim().toLowerCase()));
  const orphanLog = log.filter(
    (l) => !completedNames.has(l.name.trim().toLowerCase())
  );
  if (orphanLog.length > 0) {
    completedSheet.addRow([]); // blank separator
    const headerRow = completedSheet.addRow([
      "(Historical wins/rejections — original tracker row no longer present)",
    ]);
    headerRow.font = { italic: true, color: { argb: "FF64748B" } };
    for (const l of orphanLog) {
      completedSheet.addRow({
        name: l.name,
        award: l.amount,
        status: l.result,
        submitted: l.date,
        notes: "(from won/lost log)",
      });
    }
  }

  /* ---------- Sheet 3: Materials ---------- */
  const matsSheet = workbook.addWorksheet("Materials", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  matsSheet.columns = [
    { header: "Material", key: "name", width: 50 },
    { header: "Ready", key: "ready", width: 10 },
  ];
  matsSheet.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));
  // Pull ALL keys present in materials, even ones not in the default list,
  // so user-extended materials (if we add that later) carry through.
  for (const [name, ready] of Object.entries(materials)) {
    matsSheet.addRow({ name, ready: ready ? "Yes" : "No" });
  }
  if (Object.keys(materials).length === 0) {
    matsSheet.addRow({ name: "(no materials tracked yet)", ready: "" });
  }

  /* ---------- Generate + trigger download ---------- */
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const today = new Date().toISOString().slice(0, 10);
  const a = document.createElement("a");
  a.href = url;
  a.download = `scholarscout-tracker-${today}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after a tick so Safari's download has time to grab the URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
