import { reportRepo } from "@/lib/data/repositories";
import type { Grade, MaterialType, Report, ReportStatus, Teacher } from "@/lib/data/types";
import { materialLabel } from "@/lib/data/selectors";
import { logActivity, notify } from "./notification-service";

export type ReportInput = {
  date: string;
  teacherId: string;
  material: MaterialType;
  materialDetail: string;
  reference: string;
  grade: Grade;
  homework?: string;
  mustamiNote?: string;
};

export type ReportValidation = { ok: true } | { ok: false; errors: Record<string, string> };

function deriveStatus(input: ReportInput): ReportStatus {
  if (input.homework?.trim()) return "pr_aktif";
  return input.grade === "D" || input.grade === "C" ? "perlu_perbaikan" : "selesai";
}

export function validateReport(
  input: ReportInput,
  currentUserId: string,
  existing: Report[],
  editingId?: string,
): ReportValidation {
  const errors: Record<string, string> = {};
  if (!input.date) errors["date"] = "Tanggal wajib diisi.";
  if (!input.teacherId) errors["teacherId"] = "Nama guru wajib dipilih.";
  else if (input.teacherId === currentUserId)
    errors["teacherId"] = "Anda tidak dapat menilai diri sendiri.";
  if (!input.materialDetail.trim()) errors["materialDetail"] = "Rincian materi wajib diisi.";
  else if (input.materialDetail.trim().length > 160)
    errors["materialDetail"] = "Maksimal 160 karakter.";
  if (!input.reference.trim()) errors["reference"] = "Ayat/Hal./Juz wajib diisi.";
  else if (input.reference.trim().length > 120) errors["reference"] = "Maksimal 120 karakter.";
  if ((input.homework ?? "").length > 500) errors["homework"] = "Maksimal 500 karakter.";
  if ((input.mustamiNote ?? "").length > 500) errors["mustamiNote"] = "Maksimal 500 karakter.";

  const duplicate = existing.some(
    (r) =>
      !r.isDeleted &&
      r.id !== editingId &&
      r.teacherId === input.teacherId &&
      r.mustamiId === currentUserId &&
      r.date === input.date &&
      r.material === input.material &&
      r.reference.trim().toLowerCase() === input.reference.trim().toLowerCase(),
  );
  if (duplicate) errors["reference"] = "Setoran serupa sudah tercatat pada tanggal ini.";

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true };
}

function toRow(input: ReportInput, mustami: Teacher) {
  const homework = input.homework?.trim();
  const mustamiNote = input.mustamiNote?.trim();
  return {
    date: input.date,
    teacherId: input.teacherId,
    mustamiId: mustami.id,
    mustamiName: mustami.name,
    material: input.material,
    materialDetail: input.materialDetail.trim(),
    reference: input.reference.trim(),
    grade: input.grade,
    homeworkDone: false,
    status: deriveStatus(input),
    ...(homework ? { homework } : {}),
    ...(mustamiNote ? { mustamiNote } : {}),
  };
}

/** Report Created -> Save -> Notification -> Activity Log */
export function createReport(input: ReportInput, mustami: Teacher, assessedName: string): Report {
  const report = reportRepo.create({
    ...toRow(input, mustami),
    createdBy: mustami.id,
    updatedBy: mustami.id,
  });

  notify({
    title: "Setoran baru tercatat",
    body: `${mustami.name} menyimak setoran ${materialLabel[report.material]} Anda (${report.reference}) — nilai ${report.grade}.`,
    level: "success",
    type: "REPORT_CREATED",
    userId: report.teacherId,
    reportId: report.id,
  });

  if (report.homework) {
    notify({
      title: "PR baru",
      body: `PR dari ${mustami.name}: ${report.homework}`,
      level: "warning",
      type: "HOMEWORK_PENDING",
      userId: report.teacherId,
      reportId: report.id,
    });
  }

  logActivity({
    action: "REPORT_CREATED",
    description: `${mustami.name} membuat setoran untuk ${assessedName}.`,
    actorId: mustami.id,
    entity: "reports",
    entityId: report.id,
  });

  return report;
}

export function updateReport(
  id: string,
  input: ReportInput,
  mustami: Teacher,
  assessedName: string,
): Report | undefined {
  const existing = reportRepo.get(id);
  const row = toRow(input, mustami);
  const updated = reportRepo.update(id, {
    ...row,
    homeworkDone: existing?.homeworkDone ?? false,
    status: existing?.homeworkDone && row.status === "pr_aktif" ? "selesai" : row.status,
    updatedBy: mustami.id,
  });
  if (updated) {
    notify({
      title: "Setoran diperbarui",
      body: `${mustami.name} memperbarui catatan setoran ${updated.reference}.`,
      type: "REPORT_UPDATED",
      userId: updated.teacherId,
      reportId: updated.id,
    });
    logActivity({
      action: "REPORT_UPDATED",
      description: `${mustami.name} memperbarui setoran ${assessedName}.`,
      actorId: mustami.id,
      entity: "reports",
      entityId: id,
    });
  }
  return updated;
}

export function toggleHomework(id: string, actorId: string): Report | undefined {
  const existing = reportRepo.get(id);
  if (!existing) return undefined;
  const done = !existing.homeworkDone;
  const updated = reportRepo.update(id, {
    homeworkDone: done,
    status: done ? "selesai" : "pr_aktif",
    updatedBy: actorId,
  });
  if (updated) {
    logActivity({
      action: "HOMEWORK_UPDATED",
      description: `PR setoran ${updated.reference} ditandai ${done ? "selesai" : "belum selesai"}.`,
      actorId,
      entity: "reports",
      entityId: id,
    });
  }
  return updated;
}

/** Soft delete keeps the row for audit + future backend sync. */
export function softDeleteReport(id: string, actorId: string): Report | undefined {
  const updated = reportRepo.update(id, {
    isDeleted: true,
    deletedAt: new Date().toISOString(),
    deletedBy: actorId,
    updatedBy: actorId,
  });
  if (updated) {
    logActivity({
      action: "REPORT_DELETED",
      description: `Setoran ${updated.reference} dihapus.`,
      actorId,
      entity: "reports",
      entityId: id,
    });
  }
  return updated;
}

export function restoreReport(id: string, actorId: string): Report | undefined {
  return reportRepo.update(id, { isDeleted: false, updatedBy: actorId });
}

/** Setoran yang diterima guru (My Upgrading Progress). */
export function progressOf(reports: Report[], teacherId: string): Report[] {
  return reports.filter((r) => !r.isDeleted && r.teacherId === teacherId);
}

/** Setoran yang dinilai guru sebagai mustami' (My Assessment Activity). */
export function assessmentsOf(reports: Report[], teacherId: string): Report[] {
  return reports.filter((r) => !r.isDeleted && r.mustamiId === teacherId);
}
