import type { NotificationItem, Report, Target, Teacher } from "./types";

export function teacherName(teachers: Teacher[], id: string): string {
  return teachers.find((t) => t.id === id)?.name ?? "—";
}

export function isThisMonth(dateISO: string): boolean {
  const d = new Date(dateISO);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export function averageScore(reports: Report[]): number | null {
  if (reports.length === 0) return null;
  return Math.round(reports.reduce((sum, r) => sum + r.score, 0) / reports.length);
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

export const reportTypeLabel: Record<Report["type"], string> = {
  ziyadah: "Ziyadah",
  murojaah: "Murojaah",
  tahsin: "Tahsin",
};
