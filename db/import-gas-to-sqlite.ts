import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GAS_API_URL =
  "https://script.google.com/macros/s/AKfycbxjkSv0cAHRYDecKbyGsEKwoctLKm1Thi-S-fDnunwu7rvW-B2BA7dsyIWAU4MF33UD0w/exec";

const dbPath = path.join(__dirname, "quran_teacher.db");
const schemaPath = path.join(__dirname, "schema.sql");
const seedPath = path.join(__dirname, "seed.sql");

async function fetchGasAction(action: string): Promise<any[]> {
  try {
    const url = `${GAS_API_URL}?action=${action}&_t=${Date.now()}`;
    console.log(`📡 Fetching [${action}] from Spreadsheet API...`);
    const res = await fetch(url);
    const json = (await res.json()) as { ok: boolean; data?: any[] };
    if (json.ok && Array.isArray(json.data)) {
      return json.data;
    }
  } catch (err: any) {
    console.warn(`⚠️ Warning: Gagal mengambil data untuk action ${action}:`, err?.message || err);
  }
  return [];
}

function parseDate(val: any): string {
  if (!val) return new Date().toISOString();
  const s = String(val).trim();
  if (!s) return new Date().toISOString();

  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    return s.includes("T") ? s : `${s}T00:00:00.000Z`;
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(s)) {
    const parts = s.split("/");
    const day = parts[0].padStart(2, "0");
    const month = parts[1].padStart(2, "0");
    const year = parts[2];
    return `${year}-${month}-${day}T00:00:00.000Z`;
  }
  try {
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch {}
  return new Date().toISOString();
}

function parseBool(val: any): number {
  if (val === true || val === 1 || String(val).toUpperCase() === "YA" || String(val).toUpperCase() === "TRUE") {
    return 1;
  }
  return 0;
}

function sqlQuote(val: any): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "number") return String(val);
  const s = String(val).replace(/'/g, "''");
  return `'${s}'`;
}

async function runImport() {
  console.log("🚀 Memulai Impor & Sinkronisasi Seluruh 15 Sheet/Tabel dari Google Spreadsheet ke SQLite...\n");

  const teachersRaw = await fetchGasAction("getTeachers");
  const reportsRaw = await fetchGasAction("getReports");
  const targetsRaw = await fetchGasAction("getTargets");
  const remindersRaw = await fetchGasAction("getReminders");
  const feedbacksRaw = await fetchGasAction("getFeedbacks");
  const commentsRaw = await fetchGasAction("getComments");
  const announcementsRaw = await fetchGasAction("getAnnouncements");
  const notificationsRaw = await fetchGasAction("getNotifications");
  const achievementsRaw = await fetchGasAction("getAchievements");
  const masterBadgesRaw = await fetchGasAction("getMasterBadges");
  const activityLogsRaw = await fetchGasAction("getActivityLogs");
  const teacherRanksRaw = await fetchGasAction("getTeacherRanks");
  const xpConfigRaw = await fetchGasAction("getXpConfig");

  console.log("\n📊 Ringkasan Data dari Google Spreadsheet:");
  console.log(`  - Teachers     : ${teachersRaw.length} baris`);
  console.log(`  - Reports      : ${reportsRaw.length} baris`);
  console.log(`  - Targets      : ${targetsRaw.length} baris`);
  console.log(`  - Reminders    : ${remindersRaw.length} baris`);
  console.log(`  - Feedbacks    : ${feedbacksRaw.length} baris`);
  console.log(`  - Comments     : ${commentsRaw.length} baris`);
  console.log(`  - Announcements: ${announcementsRaw.length} baris`);
  console.log(`  - Notifications: ${notificationsRaw.length} baris`);
  console.log(`  - Achievements : ${achievementsRaw.length} baris`);
  console.log(`  - Master Badges: ${masterBadgesRaw.length} baris`);
  console.log(`  - Activity Logs: ${activityLogsRaw.length} baris`);
  console.log(`  - Teacher Ranks: ${teacherRanksRaw.length} baris`);
  console.log(`  - XP Config    : ${xpConfigRaw.length} baris\n`);

  const teacherIds = new Set<string>();

  const teachers = teachersRaw.map((r, i) => {
    const id = String(r.ID || r.id || `tea_${String(i + 1).padStart(3, "0")}`).trim();
    teacherIds.add(id);
    return {
      id,
      name: String(r["Nama Guru"] || r.name || "Pengajar").trim(),
      gender: (r.Gender || r.gender || "ustadz") === "ustadzah" ? "ustadzah" : "ustadz",
      status: (r.Status || r.status || "aktif") === "nonaktif" ? "nonaktif" : "aktif",
      phone: r["No HP"] || r.phone ? String(r["No HP"] || r.phone).trim() : null,
      level: String(r["Level Target"] || r.level || "Juz 30").trim(),
      joined_at: parseDate(r["Tanggal Bergabung"] || r.joinedAt),
      username: r.Username || r.username ? String(r.Username || r.username).trim().toLowerCase() : null,
      password: r.Password || r.password ? String(r.Password || r.password).trim() : "griya123",
      role: (r.Role || r.role || "teacher") === "upgrader" ? "upgrader" : "teacher",
      position: r.Jabatan || r.position ? String(r.Jabatan || r.position).trim() : null,
      specialization: r.Spesialisasi || r.specialization ? String(r.Spesialisasi || r.specialization).trim() : null,
      photo_url: r.photoUrl ? String(r.photoUrl).trim() : null,
      is_deleted: parseBool(r["Status Dihapus"] || r.isDeleted),
      deleted_at: r.deletedAt ? parseDate(r.deletedAt) : null,
      created_at: parseDate(r["Created At"] || r.createdAt),
      updated_at: parseDate(r["Updated At"] || r.updatedAt),
    };
  });

  const validTeacherId = (id: any): string | null => {
    if (!id) return null;
    const s = String(id).trim();
    return teacherIds.has(s) ? s : null;
  };

  const reports = reportsRaw.map((r, i) => {
    const id = String(r.ID || r.id || `rep_${i + 1}`).trim();
    const teacher_id = validTeacherId(r["ID Guru Dinilai"] || r.teacherId) || Array.from(teacherIds)[0] || "tea_001";
    const mustami_id = validTeacherId(r["ID Mustami"] || r.mustamiId) || teacher_id;

    let mat = String(r.Materi || r.material || "tahfizh").toLowerCase();
    if (!["tahfizh", "murajaah", "matn", "hadits", "lainnya"].includes(mat)) mat = "tahfizh";

    let gr = String(r["Nilai Grade"] || r.grade || "A").toUpperCase();
    if (!["A", "B", "C", "D"].includes(gr)) gr = "A";

    let st = String(r["Status Laporan"] || r.status || "selesai").toLowerCase();
    if (!["selesai", "perlu_perbaikan", "pr_aktif"].includes(st)) st = "selesai";

    return {
      id,
      teacher_id,
      mustami_id,
      mustami_name: String(r["Nama Mustami"] || r.mustamiName || "Mustami'").trim(),
      date: parseDate(r.Tanggal || r.date),
      material: mat,
      material_detail: String(r["Rincian Materi"] || r.materialDetail || "Setoran").trim(),
      reference: String(r["Referensi Ayat/Halaman"] || r.reference || "-").trim(),
      grade: gr,
      homework: r["PR/Tugas"] || r.homework ? String(r["PR/Tugas"] || r.homework).trim() : null,
      homework_done: parseBool(r["Status PR"] || r.homeworkDone),
      mustami_note: r["Catatan Mustami"] || r.mustamiNote ? String(r["Catatan Mustami"] || r.mustamiNote).trim() : null,
      status: st,
      is_deleted: parseBool(r["Status Dihapus"] || r.isDeleted),
      deleted_at: r.deletedAt ? parseDate(r.deletedAt) : null,
      deleted_by: validTeacherId(r.deletedBy),
      created_by: validTeacherId(r.createdBy || mustami_id),
      updated_by: validTeacherId(r.updatedBy),
      created_at: parseDate(r["Created At"] || r.createdAt),
      updated_at: parseDate(r["Updated At"] || r.updatedAt),
    };
  });

  const targets = targetsRaw.map((r, i) => {
    const id = String(r.ID || r.id || `tar_${i + 1}`).trim();
    const teacher_id = validTeacherId(r["ID Guru"] || r.teacherId) || Array.from(teacherIds)[0] || "tea_001";

    let per = String(r.Periode || r.period || "bulanan").toLowerCase();
    if (!["bulanan", "semester", "tahunan"].includes(per)) per = "bulanan";

    let st = String(r.Status || r.status || "aktif").toLowerCase();
    if (!["aktif", "tercapai", "gagal"].includes(st)) st = "aktif";

    return {
      id,
      teacher_id,
      title: String(r["Judul Target"] || r.title || "Target Hafalan").trim(),
      description: r.Deskripsi || r.description ? String(r.Deskripsi || r.description).trim() : null,
      period: per,
      status: st,
      start_date: parseDate(r["Tanggal Mulai"] || r.startDate),
      due_date: parseDate(r["Tenggat (Due Date)"] || r.dueDate),
      target_value: Number(r["Target Value"] || r.targetValue || 20),
      current_value: Number(r["Current Value"] || r.currentValue || 0),
      unit: String(r.Satuan || r.unit || "halaman").trim(),
      created_by: validTeacherId(r["Created By"] || r.createdBy),
      is_deleted: parseBool(r["Status Dihapus"] || r.isDeleted),
      created_at: parseDate(r["Created At"] || r.createdAt),
      updated_at: parseDate(r["Updated At"] || r.updatedAt),
    };
  });

  const reminders = remindersRaw.map((r, i) => {
    const id = String(r.ID || r.id || `rem_${i + 1}`).trim();
    const target_id = String(r["ID Target"] || r.targetId || targets[0]?.id || "tar_1").trim();
    const teacher_id = validTeacherId(r["ID Guru"] || r.teacherId) || Array.from(teacherIds)[0] || "tea_001";

    let freq = String(r.Frekuensi || r.frequency || "weekly").toLowerCase();
    if (!["once", "daily", "weekly"].includes(freq)) freq = "weekly";

    return {
      id,
      target_id,
      teacher_id,
      title: String(r["Judul Pengingat"] || r.title || "Pengingat").trim(),
      message: String(r.Pesan || r.message || "Pesan pengingat").trim(),
      frequency: freq,
      remind_at: parseDate(r["Tanggal Diingatkan"] || r.remindAt),
      dismissed: parseBool(r["Status Selesai (Dismissed)"] || r.dismissed),
      created_at: parseDate(r["Created At"] || r.createdAt),
      updated_at: parseDate(r["Updated At"] || r.updatedAt),
    };
  });

  const reportIds = new Set(reports.map((r) => r.id));
  const targetIds = new Set(targets.map((t) => t.id));

  const validReportId = (id: any): string | null => {
    if (!id) return null;
    const s = String(id).trim();
    return reportIds.has(s) ? s : null;
  };

  const validTargetId = (id: any): string | null => {
    if (!id) return null;
    const s = String(id).trim();
    return targetIds.has(s) ? s : null;
  };

  const feedbacks = feedbacksRaw
    .map((r, i) => {
      const id = String(r.ID || r.id || `fb_${i + 1}`).trim();
      const report_id = validReportId(r["ID Setoran/Report"] || r.reportId);
      if (!report_id) return null;
      const author_id = validTeacherId(r["ID Penulis"] || r.authorId) || Array.from(teacherIds)[0] || "tea_001";

      let role = (r["Role Penulis"] || r.authorRole || "teacher") === "upgrader" ? "upgrader" : "teacher";
      let type = (r["Tipe Feedback"] || r.type || "mustami") === "upgrader" ? "upgrader" : "mustami";

      return {
        id,
        report_id,
        author_id,
        author_name: String(r["Nama Penulis"] || r.authorName || "Ust. ").trim(),
        author_role: role,
        type,
        content: String(r["Isi Evaluasi/Feedback"] || r.content || "").trim(),
        created_at: parseDate(r["Created At"] || r.createdAt),
        updated_at: parseDate(r["Updated At"] || r.updatedAt),
      };
    })
    .filter((f): f is NonNullable<typeof f> => f !== null);

  const reportComments = commentsRaw
    .map((r, i) => {
      const id = String(r.ID || r.id || `com_${i + 1}`).trim();
      const report_id = validReportId(r["ID Setoran/Report"] || r.reportId);
      if (!report_id) return null;
      const author_id = validTeacherId(r["ID Penulis"] || r.authorId) || Array.from(teacherIds)[0] || "tea_001";

      return {
        id,
        report_id,
        author_id,
        author_name: String(r["Nama Penulis"] || r.authorName || "Ust. ").trim(),
        author_role: (r["Role Penulis"] || r.authorRole || "teacher") === "upgrader" ? "upgrader" : "teacher",
        content: String(r["Isi Komentar"] || r.content || "").trim(),
        created_at: parseDate(r["Created At"] || r.createdAt),
        updated_at: parseDate(r["Updated At"] || r.updatedAt),
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  const achievements = achievementsRaw.map((r, i) => {
    const id = String(r.ID || r.id || `ach_${i + 1}`).trim();
    const teacher_id = validTeacherId(r["ID Guru"] || r.teacherId) || Array.from(teacherIds)[0] || "tea_001";

    let cat = String(r.Kategori || r.category || "setoran").toLowerCase();
    if (!["umum", "setoran", "target", "mustami", "tahsin", "level"].includes(cat)) cat = "setoran";

    return {
      id,
      teacher_id,
      code: String(r["Kode Lencana"] || r.code || `BADGE_${i + 1}`).trim(),
      title: String(r["Judul Lencana"] || r.title || "Lencana").trim(),
      description: String(r.Deskripsi || r.description || "").trim(),
      category: cat,
      icon: String(r.Icon || r.icon || "Award").trim(),
      points: Number(r["Poin XP"] || r.points || 100),
      unlocked_at: parseDate(r["Tanggal Terbuka"] || r.unlockedAt),
      is_deleted: parseBool(r["Status Dihapus"] || r.isDeleted),
      deleted_at: r.deletedAt ? parseDate(r.deletedAt) : null,
      created_at: parseDate(r["Created At"] || r.createdAt),
      updated_at: parseDate(r["Updated At"] || r.updatedAt),
    };
  });

  const announcements = announcementsRaw.map((r, i) => {
    const id = String(r.ID || r.id || `ann_${i + 1}`).trim();
    const author_id = validTeacherId(r["ID Penulis"] || r.authorId) || Array.from(teacherIds)[0] || "tea_001";

    let aud = String(r["Audien Target"] || r.audience || "all").toLowerCase();
    if (!["all", "teachers", "upgraders"].includes(aud)) aud = "all";

    return {
      id,
      title: String(r["Judul Pengumuman"] || r.title || "Pengumuman").trim(),
      content: String(r["Isi Pengumuman"] || r.content || "").trim(),
      author_id,
      author_name: String(r["Nama Penulis"] || r.authorName || "Admin").trim(),
      pinned: parseBool(r["Pin Status"] || r.pinned),
      audience: aud,
      due_date: r.dueDate ? parseDate(r.dueDate) : null,
      is_deleted: parseBool(r["Status Dihapus"] || r.isDeleted),
      deleted_at: r.deletedAt ? parseDate(r.deletedAt) : null,
      created_at: parseDate(r["Created At"] || r.createdAt),
      updated_at: parseDate(r["Updated At"] || r.updatedAt),
    };
  });

  const notifications = notificationsRaw.map((r, i) => {
    const id = String(r.ID || r.id || `not_${i + 1}`).trim();
    let lvl = String(r.Level || r.level || "info").toLowerCase();
    if (!["info", "warning", "success"].includes(lvl)) lvl = "info";

    return {
      id,
      title: String(r.Judul || r.title || "Notifikasi").trim(),
      body: String(r["Pesan/Body"] || r.body || "").trim(),
      level: lvl,
      read: parseBool(r["Status Dibaca"] || r.read),
      type: r["Tipe Notifikasi"] || r.type ? String(r["Tipe Notifikasi"] || r.type).trim() : null,
      user_id: validTeacherId(r["User ID Target"] || r.userId),
      report_id: validReportId(r["Report ID"] || r.reportId),
      target_id: validTargetId(r["Target ID"] || r.targetId),
      feedback_id: null,
      comment_id: null,
      reminder_id: null,
      achievement_id: null,
      announcement_id: null,
      created_at: parseDate(r["Created At"] || r.createdAt),
      updated_at: parseDate(r["Updated At"] || r.updatedAt),
    };
  });

  const activityLogs = activityLogsRaw.map((r, i) => {
    const id = String(r.ID || r.id || `act_${i + 1}`).trim();
    return {
      id,
      action: String(r["Aksi (Action)"] || r.action || "SYSTEM_EVENT").trim(),
      description: String(r["Deskripsi Aktivitas"] || r.description || "").trim(),
      actor_id: validTeacherId(r["ID Aktor"] || r.actorId),
      actor_name: r["Nama Aktor"] || r.actorName ? String(r["Nama Aktor"] || r.actorName).trim() : null,
      entity: r["Entitas Target"] || r.entity ? String(r["Entitas Target"] || r.entity).trim() : null,
      entity_id: r["ID Entitas Target"] || r.entityId ? String(r["ID Entitas Target"] || r.entityId).trim() : null,
      created_at: parseDate(r["Created At"] || r.createdAt),
      updated_at: parseDate(r["Updated At"] || r.updatedAt),
    };
  });

  const masterBadges = masterBadgesRaw.map((r, i) => {
    const id = String(r.ID || r.id || r["Kode Lencana"] || `mb_${i + 1}`).trim();
    return {
      id,
      code: String(r["Kode Unik Lencana"] || r["Kode Lencana"] || r.code || id).trim().toUpperCase(),
      title: String(r["Judul Lencana"] || r.title || "Lencana Master").trim(),
      description: r.Deskripsi || r.description ? String(r.Deskripsi || r.description).trim() : null,
      category: String(r.Kategori || r.category || "setoran").trim().toLowerCase(),
      icon: String(r.Icon || r.icon || "Award").trim(),
      points: Number(r["Poin XP"] || r.points || 0),
      is_deleted: parseBool(r["Status Dihapus"] || r.isDeleted),
      created_at: parseDate(r["Created At"] || r.createdAt),
      updated_at: parseDate(r["Updated At"] || r.updatedAt),
    };
  });

  const teacherRanks = teacherRanksRaw.map((r, i) => {
    const id = String(r.ID || r.id || `rnk_${r.Level || r.level || i + 1}`).trim();
    return {
      id,
      level: Number(r.Level || r.level || i + 1),
      title: String(r["Nama Gelar"] || r.title || "Gelar").trim(),
      min_xp: Number(r["Syarat Min XP"] || r.minXp || 0),
      badge: String(r["Badge Icon/Emoji"] || r.badge || "🌱").trim(),
      color: String(r["Warna Class"] || r.color || "text-slate-500").trim(),
      is_deleted: parseBool(r["Status Dihapus"] || r.isDeleted),
      created_at: parseDate(r["Created At"] || r.createdAt),
      updated_at: parseDate(r["Updated At"] || r.updatedAt),
    };
  });

  const xpConfigs = xpConfigRaw.map((r, i) => {
    const id = String(r.ID || r.id || `cfg_${i + 1}`).trim();
    return {
      id,
      xp_per_setoran: Number(r["XP Per Setoran"] || r.xpPerSetoran || 30),
      bonus_grade_a: Number(r["Bonus Grade A"] || r.bonusGradeA || 20),
      xp_per_mustami: Number(r["XP Per Mustami"] || r.xpPerMustami || 25),
      xp_per_target: Number(r["XP Per Target"] || r.xpPerTarget || 100),
      created_at: parseDate(r["Created At"] || r.createdAt),
      updated_at: parseDate(r["Updated At"] || r.updatedAt),
    };
  });

  // Default fallback if xpConfig sheet empty in remote
  if (xpConfigs.length === 0) {
    xpConfigs.push({
      id: "cfg_1",
      xp_per_setoran: 30,
      bonus_grade_a: 20,
      xp_per_mustami: 25,
      xp_per_target: 100,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // Generate Seed SQL Content
  console.log("📝 Menyusun file db/seed.sql lengkap dari 15 Sheet/Tabel Spreadsheet...");

  let seedSqlContent = `-- Seed Data dari 15 Sheet Google Spreadsheet (Auto-generated)\n\n`;

  // 1. Teachers
  if (teachers.length > 0) {
    seedSqlContent += `-- 1. Teachers\nINSERT OR REPLACE INTO teachers (id, name, gender, status, phone, level, joined_at, username, password, role, position, specialization, photo_url, is_deleted, deleted_at, created_at, updated_at) VALUES\n`;
    seedSqlContent += teachers
      .map(
        (t) =>
          `(${sqlQuote(t.id)}, ${sqlQuote(t.name)}, ${sqlQuote(t.gender)}, ${sqlQuote(t.status)}, ${sqlQuote(t.phone)}, ${sqlQuote(t.level)}, ${sqlQuote(t.joined_at)}, ${sqlQuote(t.username)}, ${sqlQuote(t.password)}, ${sqlQuote(t.role)}, ${sqlQuote(t.position)}, ${sqlQuote(t.specialization)}, ${sqlQuote(t.photo_url)}, ${t.is_deleted}, ${sqlQuote(t.deleted_at)}, ${sqlQuote(t.created_at)}, ${sqlQuote(t.updated_at)})`
      )
      .join(",\n") + `;\n\n`;
  }

  // 2. Reports
  if (reports.length > 0) {
    seedSqlContent += `-- 2. Reports\nINSERT OR REPLACE INTO reports (id, teacher_id, mustami_id, mustami_name, date, material, material_detail, reference, grade, homework, homework_done, mustami_note, status, is_deleted, deleted_at, deleted_by, created_by, updated_by, created_at, updated_at) VALUES\n`;
    seedSqlContent += reports
      .map(
        (r) =>
          `(${sqlQuote(r.id)}, ${sqlQuote(r.teacher_id)}, ${sqlQuote(r.mustami_id)}, ${sqlQuote(r.mustami_name)}, ${sqlQuote(r.date)}, ${sqlQuote(r.material)}, ${sqlQuote(r.material_detail)}, ${sqlQuote(r.reference)}, ${sqlQuote(r.grade)}, ${sqlQuote(r.homework)}, ${r.homework_done}, ${sqlQuote(r.mustami_note)}, ${sqlQuote(r.status)}, ${r.is_deleted}, ${sqlQuote(r.deleted_at)}, ${sqlQuote(r.deleted_by)}, ${sqlQuote(r.created_by)}, ${sqlQuote(r.updated_by)}, ${sqlQuote(r.created_at)}, ${sqlQuote(r.updated_at)})`
      )
      .join(",\n") + `;\n\n`;
  }

  // 3. Targets
  if (targets.length > 0) {
    seedSqlContent += `-- 3. Targets\nINSERT OR REPLACE INTO targets (id, teacher_id, title, description, period, status, start_date, due_date, target_value, current_value, unit, created_by, is_deleted, created_at, updated_at) VALUES\n`;
    seedSqlContent += targets
      .map(
        (t) =>
          `(${sqlQuote(t.id)}, ${sqlQuote(t.teacher_id)}, ${sqlQuote(t.title)}, ${sqlQuote(t.description)}, ${sqlQuote(t.period)}, ${sqlQuote(t.status)}, ${sqlQuote(t.start_date)}, ${sqlQuote(t.due_date)}, ${t.target_value}, ${t.current_value}, ${sqlQuote(t.unit)}, ${sqlQuote(t.created_by)}, ${t.is_deleted}, ${sqlQuote(t.created_at)}, ${sqlQuote(t.updated_at)})`
      )
      .join(",\n") + `;\n\n`;
  }

  // 4. Reminders
  if (reminders.length > 0) {
    seedSqlContent += `-- 4. Reminders\nINSERT OR REPLACE INTO reminders (id, target_id, teacher_id, title, message, frequency, remind_at, dismissed, created_at, updated_at) VALUES\n`;
    seedSqlContent += reminders
      .map(
        (rm) =>
          `(${sqlQuote(rm.id)}, ${sqlQuote(rm.target_id)}, ${sqlQuote(rm.teacher_id)}, ${sqlQuote(rm.title)}, ${sqlQuote(rm.message)}, ${sqlQuote(rm.frequency)}, ${sqlQuote(rm.remind_at)}, ${rm.dismissed}, ${sqlQuote(rm.created_at)}, ${sqlQuote(rm.updated_at)})`
      )
      .join(",\n") + `;\n\n`;
  }

  // 5. Feedbacks
  if (feedbacks.length > 0) {
    seedSqlContent += `-- 5. Feedbacks\nINSERT OR REPLACE INTO feedbacks (id, report_id, author_id, author_name, author_role, type, content, created_at, updated_at) VALUES\n`;
    seedSqlContent += feedbacks
      .map(
        (f) =>
          `(${sqlQuote(f.id)}, ${sqlQuote(f.report_id)}, ${sqlQuote(f.author_id)}, ${sqlQuote(f.author_name)}, ${sqlQuote(f.author_role)}, ${sqlQuote(f.type)}, ${sqlQuote(f.content)}, ${sqlQuote(f.created_at)}, ${sqlQuote(f.updated_at)})`
      )
      .join(",\n") + `;\n\n`;
  }

  // 6. Comments
  if (reportComments.length > 0) {
    seedSqlContent += `-- 6. Report Comments\nINSERT OR REPLACE INTO report_comments (id, report_id, author_id, author_name, author_role, content, created_at, updated_at) VALUES\n`;
    seedSqlContent += reportComments
      .map(
        (c) =>
          `(${sqlQuote(c.id)}, ${sqlQuote(c.report_id)}, ${sqlQuote(c.author_id)}, ${sqlQuote(c.author_name)}, ${sqlQuote(c.author_role)}, ${sqlQuote(c.content)}, ${sqlQuote(c.created_at)}, ${sqlQuote(c.updated_at)})`
      )
      .join(",\n") + `;\n\n`;
  }

  // 7. Achievements
  if (achievements.length > 0) {
    seedSqlContent += `-- 7. Achievements\nINSERT OR REPLACE INTO achievements (id, teacher_id, code, title, description, category, icon, points, unlocked_at, is_deleted, deleted_at, created_at, updated_at) VALUES\n`;
    seedSqlContent += achievements
      .map(
        (a) =>
          `(${sqlQuote(a.id)}, ${sqlQuote(a.teacher_id)}, ${sqlQuote(a.code)}, ${sqlQuote(a.title)}, ${sqlQuote(a.description)}, ${sqlQuote(a.category)}, ${sqlQuote(a.icon)}, ${a.points}, ${sqlQuote(a.unlocked_at)}, ${a.is_deleted}, ${sqlQuote(a.deleted_at)}, ${sqlQuote(a.created_at)}, ${sqlQuote(a.updated_at)})`
      )
      .join(",\n") + `;\n\n`;
  }

  // 8. Announcements
  if (announcements.length > 0) {
    seedSqlContent += `-- 8. Announcements\nINSERT OR REPLACE INTO announcements (id, title, content, author_id, author_name, pinned, audience, due_date, is_deleted, deleted_at, created_at, updated_at) VALUES\n`;
    seedSqlContent += announcements
      .map(
        (an) =>
          `(${sqlQuote(an.id)}, ${sqlQuote(an.title)}, ${sqlQuote(an.content)}, ${sqlQuote(an.author_id)}, ${sqlQuote(an.author_name)}, ${an.pinned}, ${sqlQuote(an.audience)}, ${sqlQuote(an.due_date)}, ${an.is_deleted}, ${sqlQuote(an.deleted_at)}, ${sqlQuote(an.created_at)}, ${sqlQuote(an.updated_at)})`
      )
      .join(",\n") + `;\n\n`;
  }

  // 9. Notifications
  if (notifications.length > 0) {
    seedSqlContent += `-- 9. Notifications\nINSERT OR REPLACE INTO notifications (id, title, body, level, read, type, user_id, report_id, target_id, feedback_id, comment_id, reminder_id, achievement_id, announcement_id, created_at, updated_at) VALUES\n`;
    seedSqlContent += notifications
      .map(
        (n) =>
          `(${sqlQuote(n.id)}, ${sqlQuote(n.title)}, ${sqlQuote(n.body)}, ${sqlQuote(n.level)}, ${n.read}, ${sqlQuote(n.type)}, ${sqlQuote(n.user_id)}, ${sqlQuote(n.report_id)}, ${sqlQuote(n.target_id)}, ${sqlQuote(n.feedback_id)}, ${sqlQuote(n.comment_id)}, ${sqlQuote(n.reminder_id)}, ${sqlQuote(n.achievement_id)}, ${sqlQuote(n.announcement_id)}, ${sqlQuote(n.created_at)}, ${sqlQuote(n.updated_at)})`
      )
      .join(",\n") + `;\n\n`;
  }

  // 10. Activity Logs
  if (activityLogs.length > 0) {
    seedSqlContent += `-- 10. Activity Logs\nINSERT OR REPLACE INTO activity_logs (id, action, description, actor_id, actor_name, entity, entity_id, created_at, updated_at) VALUES\n`;
    seedSqlContent += activityLogs
      .map(
        (al) =>
          `(${sqlQuote(al.id)}, ${sqlQuote(al.action)}, ${sqlQuote(al.description)}, ${sqlQuote(al.actor_id)}, ${sqlQuote(al.actor_name)}, ${sqlQuote(al.entity)}, ${sqlQuote(al.entity_id)}, ${sqlQuote(al.created_at)}, ${sqlQuote(al.updated_at)})`
      )
      .join(",\n") + `;\n\n`;
  }

  // 11. Master Badges
  if (masterBadges.length > 0) {
    seedSqlContent += `-- 11. Master Badges\nINSERT OR REPLACE INTO master_badges (id, code, title, description, category, icon, points, is_deleted, created_at, updated_at) VALUES\n`;
    seedSqlContent += masterBadges
      .map(
        (mb) =>
          `(${sqlQuote(mb.id)}, ${sqlQuote(mb.code)}, ${sqlQuote(mb.title)}, ${sqlQuote(mb.description)}, ${sqlQuote(mb.category)}, ${sqlQuote(mb.icon)}, ${mb.points}, ${mb.is_deleted}, ${sqlQuote(mb.created_at)}, ${sqlQuote(mb.updated_at)})`
      )
      .join(",\n") + `;\n\n`;
  }

  // 12. Teacher Ranks
  if (teacherRanks.length > 0) {
    seedSqlContent += `-- 12. Teacher Ranks\nINSERT OR REPLACE INTO teacher_ranks (id, level, title, min_xp, badge, color, is_deleted, created_at, updated_at) VALUES\n`;
    seedSqlContent += teacherRanks
      .map(
        (tr) =>
          `(${sqlQuote(tr.id)}, ${tr.level}, ${sqlQuote(tr.title)}, ${tr.min_xp}, ${sqlQuote(tr.badge)}, ${sqlQuote(tr.color)}, ${tr.is_deleted}, ${sqlQuote(tr.created_at)}, ${sqlQuote(tr.updated_at)})`
      )
      .join(",\n") + `;\n\n`;
  }

  // 13. XP Config
  if (xpConfigs.length > 0) {
    seedSqlContent += `-- 13. XP Config\nINSERT OR REPLACE INTO xp_config (id, xp_per_setoran, bonus_grade_a, xp_per_mustami, xp_per_target, created_at, updated_at) VALUES\n`;
    seedSqlContent += xpConfigs
      .map(
        (xc) =>
          `(${sqlQuote(xc.id)}, ${xc.xp_per_setoran}, ${xc.bonus_grade_a}, ${xc.xp_per_mustami}, ${xc.xp_per_target}, ${sqlQuote(xc.created_at)}, ${sqlQuote(xc.updated_at)})`
      )
      .join(",\n") + `;\n\n`;
  }

  fs.writeFileSync(seedPath, seedSqlContent, "utf-8");
  console.log("✅ File db/seed.sql berhasil diperbarui dengan data 15 tabel Spreadsheet!\n");

  // Populate SQLite Database
  console.log("💾 Menyimpan seluruh 15 tabel data ke SQLite lokal (db/quran_teacher.db)...");
  const db = new Database(dbPath);
  db.pragma("foreign_keys = OFF;");

  const schemaSql = fs.readFileSync(schemaPath, "utf-8");
  db.exec(schemaSql);

  const tablesReverse = [
    "user_presence",
    "password_resets",
    "xp_config",
    "teacher_ranks",
    "master_badges",
    "activity_logs",
    "notifications",
    "announcements",
    "achievements",
    "report_comments",
    "feedbacks",
    "reminders",
    "targets",
    "reports",
    "teachers",
  ];
  for (const table of tablesReverse) {
    db.exec(`DELETE FROM ${table};`);
  }

  db.exec(seedSqlContent);

  db.pragma("foreign_keys = ON;");
  const fkErrors = db.prepare("PRAGMA foreign_key_check;").all();
  if (fkErrors.length > 0) {
    console.warn("⚠️ Peringatan Foreign Key Check:", fkErrors);
  }

  console.log("🎉 Impor Seluruh 15 Tabel Data Spreadsheet ke SQLite Selesai!\n");

  for (const table of tablesReverse.slice().reverse()) {
    const row = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number };
    console.log(`  - ${table.padEnd(16)}: ${row.count} baris tersimpan`);
  }

  db.close();
}

runImport().catch((err) => {
  console.error("❌ Impor Gagal:", err);
  process.exit(1);
});
