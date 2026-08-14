import { formatDate, materialLabel, statusLabel, teacherName } from "@/lib/data/selectors";
import type { Report, Target, Teacher } from "@/lib/data/types";

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

export function exportReportsCSV(reports: Report[], teachers: Teacher[]): void {
  const header = [
    "ID",
    "Tanggal",
    "Guru Dinilai",
    "Mustami",
    "Materi",
    "Rincian Materi",
    "Referensi",
    "Nilai",
    "Status PR",
    "Catatan PR",
    "Catatan Mustami",
  ].join(",");

  const rows = reports
    .filter((r) => !r.isDeleted)
    .map((r) => {
      const assessed = teacherName(teachers, r.teacherId);
      const mat = materialLabel[r.material] || r.material;
      const status = statusLabel[r.status] || r.status;
      const hwStatus = r.homework ? (r.homeworkDone ? "PR Selesai" : "PR Belum Selesai") : "Tidak Ada PR";

      return [
        `"${r.id}"`,
        `"${r.date}"`,
        `"${assessed.replace(/"/g, '""')}"`,
        `"${r.mustamiName.replace(/"/g, '""')}"`,
        `"${mat}"`,
        `"${r.materialDetail.replace(/"/g, '""')}"`,
        `"${r.reference.replace(/"/g, '""')}"`,
        `"${r.grade}"`,
        `"${hwStatus}"`,
        `"${(r.homework || "").replace(/"/g, '""')}"`,
        `"${(r.mustamiNote || "").replace(/"/g, '""')}"`,
      ].join(",");
    });

  const csvContent = "\uFEFF" + [header, ...rows].join("\n");
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(csvContent, `laporan_setoran_ghq_${dateStr}.csv`, "text/csv;charset=utf-8;");
}

export function exportTargetsCSV(targets: Target[], teachers: Teacher[]): void {
  const header = [
    "ID",
    "Guru",
    "Judul Target",
    "Periode",
    "Status",
    "Target Value",
    "Current Value",
    "Satuan",
    "Tanggal Mulai",
    "Tenggat (Due Date)",
  ].join(",");

  const rows = targets
    .filter((t) => !t.isDeleted)
    .map((t) => {
      const tName = teacherName(teachers, t.teacherId);
      return [
        `"${t.id}"`,
        `"${tName.replace(/"/g, '""')}"`,
        `"${t.title.replace(/"/g, '""')}"`,
        `"${t.period}"`,
        `"${t.status}"`,
        t.targetValue,
        t.currentValue,
        `"${t.unit}"`,
        `"${t.startDate}"`,
        `"${t.dueDate}"`,
      ].join(",");
    });

  const csvContent = "\uFEFF" + [header, ...rows].join("\n");
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(csvContent, `target_upgrading_ghq_${dateStr}.csv`, "text/csv;charset=utf-8;");
}

export function exportTeachersCSV(teachers: Teacher[]): void {
  const header = ["ID", "Nama Guru", "Username", "Gender", "Role", "Jabatan", "Spesialisasi", "Level", "No HP", "Status", "Bergabung"].join(",");

  const rows = teachers.map((t) => [
    `"${t.id}"`,
    `"${t.name.replace(/"/g, '""')}"`,
    `"${(t.username || "").replace(/"/g, '""')}"`,
    `"${t.gender}"`,
    `"${t.role || "teacher"}"`,
    `"${(t.position || "").replace(/"/g, '""')}"`,
    `"${(t.specialization || "").replace(/"/g, '""')}"`,
    `"${t.level}"`,
    `"${t.phone || ""}"`,
    `"${t.status}"`,
    `"${t.joinedAt}"`,
  ].join(","));

  const csvContent = "\uFEFF" + [header, ...rows].join("\n");
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(csvContent, `data_guru_ghq_${dateStr}.csv`, "text/csv;charset=utf-8;");
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
