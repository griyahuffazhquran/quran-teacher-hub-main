import type { Grade, MaterialType, NotificationItem, Report, Target, Teacher } from "./types";

export function teacherName(teachers: Teacher[], id: string): string {
  return teachers.find((t) => t.id === id)?.name ?? "—";
}

export function isThisMonth(dateISO: string): boolean {
  const d = new Date(dateISO);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
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
  return reports.filter((r) => !r.isDeleted);
}

export function pendingHomework(reports: Report[]): Report[] {
  return reports.filter((r) => !r.homeworkDone && !!r.homework);
}

export function targetProgress(target: Target): number {
  if (target.targetValue <= 0) return 0;
  return Math.min(100, Math.round((target.currentValue / target.targetValue) * 100));
}

export function unreadCount(items: NotificationItem[]): number {
  return items.filter((n) => !n.read).length;
}

export function sortByDateDesc<T extends { date: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => b.date.localeCompare(a.date));
}

export function formatDate(dateISO: string): string {
  return new Date(dateISO).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export const materialLabel: Record<MaterialType, string> = {
  tahfizh: "Tahfizh Al-Qur'an",
  matn: "Matn",
  hadits: "Hadits",
  lainnya: "Lainnya",
};

export const materialOptions = Object.entries(materialLabel).map(([value, label]) => ({
  value: value as MaterialType,
  label,
}));

export const gradeOptions: Grade[] = ["A", "B", "C", "D"];

export const statusLabel: Record<Report["status"], string> = {
  selesai: "Selesai",
  perlu_perbaikan: "Perlu Perbaikan",
  pr_aktif: "PR Aktif",
};
