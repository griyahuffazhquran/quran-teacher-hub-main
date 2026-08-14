import type { Grade, MaterialType, Report } from "./types";

const legacyMaterial: Record<string, MaterialType> = {
  ziyadah: "tahfizh",
  murojaah: "tahfizh",
  tahsin: "tahfizh",
};

const legacyDetail: Record<string, string> = {
  ziyadah: "Ziyadah",
  murojaah: "Murojaah",
  tahsin: "Tahsin",
};

function scoreToGrade(score: number): Grade {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  return "D";
}

/** Upgrades pre-Phase-3 report rows to the current schema. */
export function migrateReports(rows: unknown[]): Report[] {
  return rows.map((raw) => {
    const r = raw as Record<string, unknown>;
    if (r["material"] && r["grade"]) return r as unknown as Report;

    const legacyType = String(r["type"] ?? "");
    const surah = String(r["surah"] ?? "");
    const from = r["fromAyah"];
    const to = r["toAyah"];
    const homework = r["homework"] as string | undefined;
    const homeworkDone = Boolean(r["homeworkDone"]);

    return {
      ...(r as object),
      material: legacyMaterial[legacyType] ?? "lainnya",
      materialDetail: legacyDetail[legacyType] ?? "Setoran",
      reference: surah ? `${surah} ${from ?? ""}-${to ?? ""}`.trim() : "-",
      grade: scoreToGrade(Number(r["score"] ?? 0)),
      mustamiId: (r["mustamiId"] as string) ?? "",
      mustamiName: (r["mustamiName"] as string) ?? "—",
      mustamiNote: (r["mustamiNote"] as string) ?? (r["note"] as string | undefined),
      homeworkDone,
      status: homework && !homeworkDone ? "pr_aktif" : "selesai",
    } as Report;
  });
}
