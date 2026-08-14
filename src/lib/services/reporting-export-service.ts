import { allRepos, hydrateAll } from "@/lib/data/repositories";
import { formatDate, materialLabel, statusLabel, teacherName } from "@/lib/data/selectors";
import type {
  Achievement,
  ActivityLog,
  Announcement,
  Feedback,
  NotificationItem,
  Reminder,
  Report,
  ReportComment,
  Target,
  Teacher,
} from "@/lib/data/types";

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/** 1. Data Guru (teachers.csv) */
export function exportTeachersCSV(teachers: Teacher[]): void {
  const header = [
    "ID",
    "Nama Guru",
    "Username",
    "Gender",
    "Role",
    "Jabatan",
    "Spesialisasi",
    "Level Target",
    "No HP",
    "Status",
    "Tanggal Bergabung",
    "Created At",
    "Updated At",
  ].join(",");

  const rows = teachers.map((t) =>
    [
      escapeCSV(t.id),
      escapeCSV(t.name),
      escapeCSV(t.username || ""),
      escapeCSV(t.gender),
      escapeCSV(t.role || "teacher"),
      escapeCSV(t.position || ""),
      escapeCSV(t.specialization || ""),
      escapeCSV(t.level),
      escapeCSV(t.phone || ""),
      escapeCSV(t.status),
      escapeCSV(t.joinedAt),
      escapeCSV(t.createdAt),
      escapeCSV(t.updatedAt),
    ].join(","),
  );

  const csvContent = "\uFEFF" + [header, ...rows].join("\n");
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(csvContent, `1_teachers_ghq_${dateStr}.csv`, "text/csv;charset=utf-8;");
}

/** 2. Setoran Upgrading (reports.csv) */
export function exportReportsCSV(reports: Report[], teachers: Teacher[]): void {
  const header = [
    "ID",
    "Tanggal",
    "ID Guru Dinilai",
    "Nama Guru Dinilai",
    "ID Mustami",
    "Nama Mustami",
    "Materi",
    "Rincian Materi",
    "Referensi Ayat/Halaman",
    "Nilai Grade",
    "PR/Tugas",
    "Status PR",
    "Catatan Mustami",
    "Status Laporan",
    "Created At",
    "Updated At",
  ].join(",");

  const rows = reports
    .filter((r) => !r.isDeleted)
    .map((r) => {
      const assessed = teacherName(teachers, r.teacherId);
      const mat = materialLabel[r.material] || r.material;
      const status = statusLabel[r.status] || r.status;
      const hwStatus = r.homework ? (r.homeworkDone ? "PR Selesai" : "PR Belum Selesai") : "Tidak Ada PR";

      return [
        escapeCSV(r.id),
        escapeCSV(r.date),
        escapeCSV(r.teacherId),
        escapeCSV(assessed),
        escapeCSV(r.mustamiId),
        escapeCSV(r.mustamiName),
        escapeCSV(mat),
        escapeCSV(r.materialDetail),
        escapeCSV(r.reference),
        escapeCSV(r.grade),
        escapeCSV(r.homework || ""),
        escapeCSV(hwStatus),
        escapeCSV(r.mustamiNote || ""),
        escapeCSV(status),
        escapeCSV(r.createdAt),
        escapeCSV(r.updatedAt),
      ].join(",");
    });

  const csvContent = "\uFEFF" + [header, ...rows].join("\n");
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(csvContent, `2_reports_ghq_${dateStr}.csv`, "text/csv;charset=utf-8;");
}

/** 3. Target Upgrading (targets.csv) */
export function exportTargetsCSV(targets: Target[], teachers: Teacher[]): void {
  const header = [
    "ID",
    "ID Guru",
    "Nama Guru",
    "Judul Target",
    "Deskripsi",
    "Periode",
    "Status",
    "Target Value",
    "Current Value",
    "Satuan",
    "Tanggal Mulai",
    "Tenggat (Due Date)",
    "Created By",
    "Created At",
    "Updated At",
  ].join(",");

  const rows = targets
    .filter((t) => !t.isDeleted)
    .map((t) => {
      const tName = teacherName(teachers, t.teacherId);
      return [
        escapeCSV(t.id),
        escapeCSV(t.teacherId),
        escapeCSV(tName),
        escapeCSV(t.title),
        escapeCSV(t.description || ""),
        escapeCSV(t.period),
        escapeCSV(t.status),
        t.targetValue,
        t.currentValue,
        escapeCSV(t.unit),
        escapeCSV(t.startDate),
        escapeCSV(t.dueDate),
        escapeCSV(t.createdBy || ""),
        escapeCSV(t.createdAt),
        escapeCSV(t.updatedAt),
      ].join(",");
    });

  const csvContent = "\uFEFF" + [header, ...rows].join("\n");
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(csvContent, `3_targets_ghq_${dateStr}.csv`, "text/csv;charset=utf-8;");
}

/** 4. Reminders / Pengingat (reminders.csv) */
export function exportRemindersCSV(reminders: Reminder[]): void {
  const header = [
    "ID",
    "ID Target",
    "ID Guru",
    "Judul Pengingat",
    "Pesan",
    "Frekuensi",
    "Tanggal Diingatkan",
    "Status Selesai (Dismissed)",
    "Created At",
    "Updated At",
  ].join(",");

  const rows = reminders.map((rm) => [
    escapeCSV(rm.id),
    escapeCSV(rm.targetId),
    escapeCSV(rm.teacherId),
    escapeCSV(rm.title),
    escapeCSV(rm.message),
    escapeCSV(rm.frequency),
    escapeCSV(rm.remindAt),
    escapeCSV(rm.dismissed ? "YA" : "TIDAK"),
    escapeCSV(rm.createdAt),
    escapeCSV(rm.updatedAt),
  ].join(","));

  const csvContent = "\uFEFF" + [header, ...rows].join("\n");
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(csvContent, `4_reminders_ghq_${dateStr}.csv`, "text/csv;charset=utf-8;");
}

/** 5. Feedback Evaluasi (feedbacks.csv) */
export function exportFeedbacksCSV(feedbacks: Feedback[]): void {
  const header = [
    "ID",
    "ID Setoran/Report",
    "ID Penulis",
    "Nama Penulis",
    "Role Penulis",
    "Tipe Feedback",
    "Isi Evaluasi/Feedback",
    "Created At",
    "Updated At",
  ].join(",");

  const rows = feedbacks.map((f) => [
    escapeCSV(f.id),
    escapeCSV(f.reportId),
    escapeCSV(f.authorId),
    escapeCSV(f.authorName),
    escapeCSV(f.authorRole),
    escapeCSV(f.type),
    escapeCSV(f.content),
    escapeCSV(f.createdAt),
    escapeCSV(f.updatedAt),
  ].join(","));

  const csvContent = "\uFEFF" + [header, ...rows].join("\n");
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(csvContent, `5_feedbacks_ghq_${dateStr}.csv`, "text/csv;charset=utf-8;");
}

/** 6. Komentar Diskusi (comments.csv) */
export function exportCommentsCSV(comments: ReportComment[]): void {
  const header = [
    "ID",
    "ID Setoran/Report",
    "ID Penulis",
    "Nama Penulis",
    "Role Penulis",
    "Isi Komentar",
    "Created At",
    "Updated At",
  ].join(",");

  const rows = comments.map((c) => [
    escapeCSV(c.id),
    escapeCSV(c.reportId),
    escapeCSV(c.authorId),
    escapeCSV(c.authorName),
    escapeCSV(c.authorRole || ""),
    escapeCSV(c.content),
    escapeCSV(c.createdAt),
    escapeCSV(c.updatedAt),
  ].join(","));

  const csvContent = "\uFEFF" + [header, ...rows].join("\n");
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(csvContent, `6_comments_ghq_${dateStr}.csv`, "text/csv;charset=utf-8;");
}

/** 7. Pengumuman (announcements.csv) */
export function exportAnnouncementsCSV(announcements: Announcement[]): void {
  const header = [
    "ID",
    "Judul Pengumuman",
    "Isi Pengumuman",
    "ID Penulis",
    "Nama Penulis",
    "Pin Status",
    "Audien Target",
    "Created At",
    "Updated At",
  ].join(",");

  const rows = announcements.map((a) => [
    escapeCSV(a.id),
    escapeCSV(a.title),
    escapeCSV(a.content),
    escapeCSV(a.authorId),
    escapeCSV(a.authorName),
    escapeCSV(a.pinned ? "YA" : "TIDAK"),
    escapeCSV(a.audience),
    escapeCSV(a.createdAt),
    escapeCSV(a.updatedAt),
  ].join(","));

  const csvContent = "\uFEFF" + [header, ...rows].join("\n");
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(csvContent, `7_announcements_ghq_${dateStr}.csv`, "text/csv;charset=utf-8;");
}

/** 8. Notifikasi (notifications.csv) */
export function exportNotificationsCSV(notifications: NotificationItem[]): void {
  const header = [
    "ID",
    "Judul",
    "Pesan/Body",
    "Level",
    "Status Dibaca",
    "Tipe Notifikasi",
    "User ID Target",
    "Report ID",
    "Target ID",
    "Created At",
    "Updated At",
  ].join(",");

  const rows = notifications.map((n) => [
    escapeCSV(n.id),
    escapeCSV(n.title),
    escapeCSV(n.body),
    escapeCSV(n.level),
    escapeCSV(n.read ? "YA" : "TIDAK"),
    escapeCSV(n.type || ""),
    escapeCSV(n.userId || "SEMUA"),
    escapeCSV(n.reportId || ""),
    escapeCSV(n.targetId || ""),
    escapeCSV(n.createdAt),
    escapeCSV(n.updatedAt),
  ].join(","));

  const csvContent = "\uFEFF" + [header, ...rows].join("\n");
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(csvContent, `8_notifications_ghq_${dateStr}.csv`, "text/csv;charset=utf-8;");
}

/** 9. Lencana Gamifikasi (achievements.csv) */
export function exportAchievementsCSV(achievements: Achievement[]): void {
  const header = [
    "ID",
    "ID Guru",
    "Kode Lencana",
    "Judul Lencana",
    "Deskripsi",
    "Kategori",
    "Poin XP",
    "Tanggal Terbuka",
    "Created At",
    "Updated At",
  ].join(",");

  const rows = achievements.map((a) => [
    escapeCSV(a.id),
    escapeCSV(a.teacherId),
    escapeCSV(a.code),
    escapeCSV(a.title),
    escapeCSV(a.description),
    escapeCSV(a.category),
    a.points,
    escapeCSV(a.unlockedAt),
    escapeCSV(a.createdAt),
    escapeCSV(a.updatedAt),
  ].join(","));

  const csvContent = "\uFEFF" + [header, ...rows].join("\n");
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(csvContent, `9_achievements_ghq_${dateStr}.csv`, "text/csv;charset=utf-8;");
}

/** 10. Log Aktivitas (activity_logs.csv) */
export function exportActivityLogsCSV(logs: ActivityLog[]): void {
  const header = [
    "ID",
    "Aksi (Action)",
    "Deskripsi Aktivitas",
    "ID Aktor",
    "Nama Aktor",
    "Entitas Target",
    "ID Entitas Target",
    "Created At",
    "Updated At",
  ].join(",");

  const rows = logs.map((l) => [
    escapeCSV(l.id),
    escapeCSV(l.action),
    escapeCSV(l.description),
    escapeCSV(l.actorId || ""),
    escapeCSV(l.actorName || ""),
    escapeCSV(l.entity || ""),
    escapeCSV(l.entityId || ""),
    escapeCSV(l.createdAt),
    escapeCSV(l.updatedAt),
  ].join(","));

  const csvContent = "\uFEFF" + [header, ...rows].join("\n");
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(csvContent, `10_activity_logs_ghq_${dateStr}.csv`, "text/csv;charset=utf-8;");
}

/** Function to trigger download of ALL 10 Database Tables for Google Sheets & AppsScript Migration */
export function exportAllDatabaseTablesCSV(repos: typeof allRepos): void {
  hydrateAll();

  // Find repos
  const teachers = (repos.find((r) => r.name === "teachers")?.list() || []) as Teacher[];
  const reports = (repos.find((r) => r.name === "reports")?.list() || []) as Report[];
  const targets = (repos.find((r) => r.name === "targets")?.list() || []) as Target[];
  const reminders = (repos.find((r) => r.name === "reminders")?.list() || []) as Reminder[];
  const feedbacks = (repos.find((r) => r.name === "feedbacks")?.list() || []) as Feedback[];
  const comments = (repos.find((r) => r.name === "comments")?.list() || []) as ReportComment[];
  const announcements = (repos.find((r) => r.name === "announcements")?.list() || []) as Announcement[];
  const notifications = (repos.find((r) => r.name === "notifications")?.list() || []) as NotificationItem[];
  const achievements = (repos.find((r) => r.name === "achievements")?.list() || []) as Achievement[];
  const activityLogs = (repos.find((r) => r.name === "activityLogs")?.list() || []) as ActivityLog[];

  // Sequential triggers for all 10 CSV files
  exportTeachersCSV(teachers);
  setTimeout(() => exportReportsCSV(reports, teachers), 300);
  setTimeout(() => exportTargetsCSV(targets, teachers), 600);
  setTimeout(() => exportRemindersCSV(reminders), 900);
  setTimeout(() => exportFeedbacksCSV(feedbacks), 1200);
  setTimeout(() => exportCommentsCSV(comments), 1500);
  setTimeout(() => exportAnnouncementsCSV(announcements), 1800);
  setTimeout(() => exportNotificationsCSV(notifications), 2100);
  setTimeout(() => exportAchievementsCSV(achievements), 2400);
  setTimeout(() => exportActivityLogsCSV(activityLogs), 2700);
}

export function printReportEvaluationSheet(report: Report, assessedName: string): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Lembar Evaluasi Setoran Upgrading - Griya Huffazh Quran</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #0f766e; padding-bottom: 15px; margin-bottom: 30px; }
        .header h1 { margin: 0; color: #0f766e; font-size: 22px; }
        .header p { margin: 4px 0 0; color: #64748b; font-size: 13px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; }
        .label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; }
        .value { font-size: 14px; font-weight: 600; color: #0f172a; margin-top: 2px; }
        .grade-box { display: inline-block; background: #0f766e; color: white; padding: 4px 12px; border-radius: 6px; font-weight: bold; font-size: 16px; }
        .section-title { font-size: 13px; font-weight: bold; color: #0f766e; margin-top: 20px; margin-bottom: 8px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        .footer { margin-top: 50px; display: flex; justify-content: space-between; text-align: center; }
        .sig-box { width: 200px; border-top: 1px solid #94a3b8; padding-top: 6px; font-size: 12px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>GRIYA HUFFAZH QURAN</h1>
        <p>Lembar Evaluasi Upgrading Hafalan & Studi Pengajar</p>
      </div>

      <div class="grid">
        <div class="card">
          <div class="label">Guru Yang Dinilai</div>
          <div class="value">${assessedName}</div>
        </div>
        <div class="card">
          <div class="label">Mustami' (Penyimak)</div>
          <div class="value">${report.mustamiName}</div>
        </div>
        <div class="card">
          <div class="label">Tanggal Setoran</div>
          <div class="value">${formatDate(report.date)}</div>
        </div>
        <div class="card">
          <div class="label">Nilai / Predikat</div>
          <div class="value"><span class="grade-box">Nilai ${report.grade}</span></div>
        </div>
      </div>

      <div class="section-title">Rincian Materi Setoran</div>
      <div class="card" style="margin-bottom: 15px;">
        <div class="value">${report.materialDetail}</div>
        <div style="font-size: 13px; color: #475569;">Referensi: ${report.reference}</div>
      </div>

      <div class="section-title">Catatan Evaluasi Mustami'</div>
      <div class="card" style="margin-bottom: 15px; min-height: 60px;">
        <div>${report.mustamiNote || "Tidak ada catatan khusus."}</div>
      </div>

      <div class="section-title">Catatan PR / Tugas Tindak Lanjut</div>
      <div class="card" style="margin-bottom: 15px;">
        <div>${report.homework || "Tidak ada catatan PR."} (${report.homeworkDone ? "PR Selesai" : "PR Belum Selesai"})</div>
      </div>

      <div class="footer">
        <div class="sig-box">
          Guru Yang Dinilai<br><br><br><br>
          ( ${assessedName} )
        </div>
        <div class="sig-box">
          Mustami' / Upgrader<br><br><br><br>
          ( ${report.mustamiName} )
        </div>
      </div>

      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
