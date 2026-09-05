import type { Grade, MaterialType, NotificationItem, Report, Target, Teacher } from "./types";

export function teacherName(teachers: Teacher[], id: string): string {
  return teachers.find((t) => t.id === id)?.name ?? "—";
}

export function parseDateToTimestamp(dateStr?: string | null): number {
  if (!dateStr) return 0;
  const s = String(dateStr).trim();
  const isoTime = Date.parse(s);
  if (!isNaN(isoTime) && s.includes("-") && s.includes("T")) return isoTime;

  const parts = s.split(/[\/\-\.]/);
  if (parts.length === 3) {
    const p1 = parseInt(parts[0] || "0", 10);
    const p2 = parseInt(parts[1] || "0", 10);
    const p3 = parseInt(parts[2] || "0", 10);

    if (p1 > 31) {
      const parsed = new Date(p1, p2 - 1, p3).getTime();
      if (!isNaN(parsed)) return parsed;
    } else {
      let year = p3;
      if (year < 100) year += 2000;
      const parsed = new Date(year, p2 - 1, p1).getTime();
      if (!isNaN(parsed)) return parsed;
    }
  }
  return isNaN(isoTime) ? 0 : isoTime;
}

export function isThisMonth(dateISO: string): boolean {
  if (!dateISO) return false;
  let s = String(dateISO).trim();
  const match = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    const day = match[1]!.padStart(2, "0");
    const month = match[2]!.padStart(2, "0");
    const year = match[3]!;
    s = `${year}-${month}-${day}`;
  }
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  } catch {
    return false;
  }
}

export function formatDate(dateISO: string | undefined | null): string {
  if (!dateISO) return "—";
  const s = String(dateISO).trim();
  if (!s) return "—";

  let parsableDate = s;
  const match = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (match) {
    const day = match[1]!.padStart(2, "0");
    const month = match[2]!.padStart(2, "0");
    const year = match[3]!;
    parsableDate = `${year}-${month}-${day}`;
  }

  try {
    const d = new Date(parsableDate);
    if (isNaN(d.getTime())) return s;
    return d.toLocaleDateString("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return s;
  }
}

export const gradeValue: Record<Grade, number> = { A: 95, B: 85, C: 75, D: 65 };

export function parseGrade(raw: any): Grade {
  if (raw === null || raw === undefined) return "B";
  const str = String(raw).trim().toUpperCase();
  if (str === "A" || str === "B" || str === "C" || str === "D") {
    return str as Grade;
  }
  const num = Number(raw);
  if (!isNaN(num) && num > 0) {
    if (num >= 90) return "A";
    if (num >= 80) return "B";
    if (num >= 70) return "C";
    return "D";
  }
  return "B";
}

export function averageScore(reports: Report[]): number | null {
  if (!reports || reports.length === 0) return null;
  const total = reports.reduce((sum, r) => {
    const g = parseGrade(r.grade);
    return sum + (gradeValue[g] ?? 85);
  }, 0);
  const avg = Math.round(total / reports.length);
  return isNaN(avg) ? null : avg;
}

export function averageGrade(reports: Report[]): Grade | null {
  const avg = averageScore(reports);
  if (avg === null) return null;
  if (avg >= 90) return "A";
  if (avg >= 80) return "B";
  if (avg >= 70) return "C";
  return "D";
}

export function activeReports(reports: Report[]): Report[] {
  if (!Array.isArray(reports)) return [];
  return reports.filter((r) => Boolean(r && !r.isDeleted));
}

export function activeTeachers(teachers: Teacher[]): Teacher[] {
  if (!Array.isArray(teachers)) return [];
  return teachers.filter((t) => Boolean(t && !t.isDeleted && t.status !== "nonaktif"));
}

export function activeTargets(targets: Target[]): Target[] {
  if (!Array.isArray(targets)) return [];
  return targets.filter((t) => Boolean(t && !t.isDeleted));
}

export function pendingHomework(reports: Report[]): Report[] {
  if (!Array.isArray(reports)) return [];
  return reports.filter((r) => Boolean(r && !r.homeworkDone && !!r.homework));
}

export function targetProgress(target: Target): number {
  if (target.targetValue <= 0) return 0;
  return Math.min(100, Math.round((target.currentValue / target.targetValue) * 100));
}

export function unreadCount(items: NotificationItem[]): number {
  return items.filter((n) => !n.read).length;
}

export function sortByDateDesc<T extends { date: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

export function formatDateTime(dateISO: string | undefined | null): { date: string; time: string; full: string } {
  if (!dateISO) return { date: "—", time: "", full: "—" };
  const s = String(dateISO).trim();
  if (!s) return { date: "—", time: "", full: "—" };

  let parsableDate = s;
  const dmyMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1]!.padStart(2, "0");
    const month = dmyMatch[2]!.padStart(2, "0");
    const year = dmyMatch[3]!;
    parsableDate = `${year}-${month}-${day}`;
  }

  try {
    const d = new Date(parsableDate);
    if (isNaN(d.getTime())) return { date: s, time: "", full: s };

    const dateStr = d.toLocaleDateString("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const hasTime = s.includes("T") || s.includes(":");
    if (!hasTime) {
      return { date: dateStr, time: "", full: dateStr };
    }

    const timeStr = d.toLocaleTimeString("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    return {
      date: dateStr,
      time: `${timeStr} WIB`,
      full: `${dateStr} • ${timeStr} WIB`,
    };
  } catch {
    return { date: s, time: "", full: s };
  }
}

export const materialLabel: Record<MaterialType, string> = {
  tahfizh: "Tahfizh Al-Qur'an",
  murajaah: "Muraja'ah",
  matn: "Matn",
  hadits: "Hadits",
  lainnya: "Lainnya",
};

export const materialOptions: { value: MaterialType; label: string }[] = [
  { value: "tahfizh", label: "Tahfizh Al-Qur'an" },
  { value: "murajaah", label: "Muraja'ah" },
  { value: "matn", label: "Matn" },
  { value: "hadits", label: "Hadits" },
  { value: "lainnya", label: "Lainnya" },
];

export const gradeOptions: Grade[] = ["A", "B", "C", "D"];

export const statusLabel: Record<Report["status"], string> = {
  selesai: "Selesai",
  perlu_perbaikan: "Perlu Perbaikan",
  pr_aktif: "PR Aktif",
};
