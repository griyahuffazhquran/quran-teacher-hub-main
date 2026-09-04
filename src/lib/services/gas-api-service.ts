import { getGasApiUrl, isGasApiConfigured } from "@/lib/config/api-config";
import { allRepos, hydrateAll } from "@/lib/data/repositories";
import { parseGrade } from "@/lib/data/selectors";
import type { Teacher, TeacherRank } from "@/lib/data/types";
import { setSession } from "./session-service";
import { evaluateAllTeachersAchievements, setMasterAchievementsCache, setTeacherRanksCache } from "./achievement-service";
import { evaluateAutomaticNotifications } from "./auto-notification-service";

export type GasResponse<T = any> = {
  ok: boolean;
  data?: T;
  error?: string;
};

/** Helper to clean and sanitize Google Apps Script Web App URL */
function cleanUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  if (url.startsWith('"') && url.endsWith('"')) url = url.slice(1, -1);
  if (url.startsWith("'") && url.endsWith("'")) url = url.slice(1, -1);
  return url.trim();
}

export async function fetchFromGas<T = any>(
  action: string,
  queryParams: Record<string, string> = {},
): Promise<GasResponse<T>> {
  const rawUrl = getGasApiUrl();
  if (!rawUrl) return { ok: false, error: "URL API Google Apps Script belum dikonfigurasi." };

  const url = cleanUrl(rawUrl);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const params = new URLSearchParams({ action, _t: Date.now().toString(), ...queryParams });
    const fullUrl = `${url}?${params.toString()}`;
    const response = await fetch(fullUrl, {
      method: "GET",
      headers: { Accept: "application/json", "Cache-Control": "no-cache" },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const text = await response.text();

    if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
      return {
        ok: false,
        error:
          "Google Apps Script mengembalikan halaman HTML. Pastikan Web App Anda di-deploy dengan akses 'Anyone' (Siapa Saja).",
      };
    }

    try {
      const json = JSON.parse(text);
      return json;
    } catch {
      return { ok: false, error: "Respon dari Google Apps Script bukan JSON yang valid." };
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    return { ok: false, error: err?.name === "AbortError" ? "Koneksi API timeout." : (err?.message || "Gagal terhubung ke Google Apps Script API.") };
  }
}

export async function postToGas<T = any>(
  action: string,
  payload: Record<string, any> = {},
): Promise<GasResponse<T>> {
  const rawUrl = getGasApiUrl();
  if (!rawUrl) return { ok: false, error: "URL API Google Apps Script belum dikonfigurasi." };

  const url = cleanUrl(rawUrl);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, ...payload }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const text = await response.text();

    if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
      return {
        ok: false,
        error:
          "Google Apps Script mengembalikan halaman HTML. Pastikan Web App Anda di-deploy dengan akses 'Anyone' (Siapa Saja).",
      };
    }

    try {
      const json = JSON.parse(text);
      return json;
    } catch {
      return { ok: false, error: "Respon dari Google Apps Script bukan JSON yang valid." };
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    return { ok: false, error: err?.name === "AbortError" ? "Koneksi API timeout." : (err?.message || "Gagal mengirim data ke Google Apps Script API.") };
  }
}

/** Converts ISO/any date string to dd/mm/yyyy format for Google Spreadsheet */
function formatDateDDMMYYYY(val: string | undefined): string {
  if (!val) return "";
  const s = String(val).trim();
  if (!s) return "";
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(s)) return s;
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return s;
  }
}

import { toInputDate } from "@/lib/utils";

/** Parses date string safely from dd/mm/yyyy or ISO to YYYY-MM-DD */
function parseGasDate(val: string | undefined): string {
  return toInputDate(val);
}

/** Normalize individual row objects safely based on repository collection name */
function normalizeRow(repoName: string, row: any): any {
  if (!row || typeof row !== "object") return null;

  const rawId = row.ID || row.id || row.Id;
  if (!rawId) return null;

  const id = String(rawId).trim();
  const createdAt = parseGasDate(row["Created At"] || row.createdAt || new Date().toISOString());
  const updatedAt = parseGasDate(row["Updated At"] || row.updatedAt || new Date().toISOString());
  const isDeleted = String(row["Status Dihapus"] || row.isDeleted || "").toUpperCase() === "YA" || Boolean(row.isDeleted);

  switch (repoName) {
    case "teachers":
      return {
        id,
        name: String(row["Nama Guru"] || row.name || "Pengajar"),
        username: String(row.Username || row.username || "").toLowerCase(),
        password: String(row.Password || row.password || "griya123"),
        gender: (row.Gender || row.gender || "ustadz") === "ustadzah" ? "ustadzah" : "ustadz",
        role: (row.Role || row.role || "teacher") === "upgrader" ? "upgrader" : "teacher",
        position: String(row.Jabatan || row.position || ""),
        specialization: String(row.Spesialisasi || row.specialization || ""),
        level: String(row["Level Target"] || row.level || "Juz 1"),
        phone: String(row["No HP"] || row.phone || ""),
        status: (row.Status || row.status || "aktif") === "nonaktif" ? "nonaktif" : "aktif",
        joinedAt: parseGasDate(row["Tanggal Bergabung"] || row.joinedAt || new Date().toISOString().slice(0, 10)),
        isDeleted,
        createdAt,
        updatedAt,
      };

    case "reports":
      return {
        id,
        date: parseGasDate(row.Tanggal || row.date || new Date().toISOString().slice(0, 10)),
        teacherId: String(row["ID Guru Dinilai"] || row.teacherId || ""),
        teacherName: String(row["Nama Guru Dinilai"] || row["Nama Penyetor"] || row.teacherName || ""),
        mustamiId: String(row["ID Mustami"] || row.mustamiId || ""),
        mustamiName: String(row["Nama Mustami"] || row.mustamiName || ""),
        material: String(row.Materi || row.material || "tahfizh"),
        materialDetail: String(row["Rincian Materi"] || row.materialDetail || ""),
        reference: String(row["Referensi Ayat/Halaman"] || row.reference || ""),
        grade: parseGrade(row["Nilai Grade"] || row.grade),
        homework: String(row["PR/Tugas"] || row.homework || ""),
        homeworkDone: String(row["Status PR"] || row.homeworkDone).includes("Selesai") || Boolean(row.homeworkDone),
        mustamiNote: String(row["Catatan Mustami"] || row.mustamiNote || ""),
        status: String(row["Status Laporan"] || row.status || "verified"),
        isDeleted,
        createdAt,
        updatedAt,
      };

    case "targets":
      return {
        id,
        teacherId: String(row["ID Guru"] || row.teacherId || ""),
        title: String(row["Judul Target"] || row.title || ""),
        description: String(row.Deskripsi || row.description || ""),
        period: String(row.Periode || row.period || "bulanan"),
        status: String(row.Status || row.status || "proses"),
        targetValue: Number(row["Target Value"] || row.targetValue || 100),
        currentValue: Number(row["Current Value"] || row.currentValue || 0),
        satuan: String(row.Satuan || row.unit || "Halaman"),
        unit: String(row.Satuan || row.unit || "Halaman"),
        startDate: String(row["Tanggal Mulai"] || row.startDate || new Date().toISOString().slice(0, 10)),
        dueDate: String(row["Tenggat (Due Date)"] || row.dueDate || new Date().toISOString().slice(0, 10)),
        createdBy: String(row["Created By"] || row.createdBy || ""),
        isDeleted,
        createdAt,
        updatedAt,
      };

    case "reminders":
      return {
        id,
        targetId: String(row["ID Target"] || row.targetId || ""),
        teacherId: String(row["ID Guru"] || row.teacherId || ""),
        title: String(row["Judul Pengingat"] || row.title || ""),
        message: String(row.Pesan || row.message || ""),
        frequency: String(row.Frekuensi || row.frequency || "mingguan"),
        remindAt: String(row["Tanggal Diingatkan"] || row.remindAt || new Date().toISOString().slice(0, 10)),
        dismissed: String(row["Status Selesai (Dismissed)"] || row.dismissed).toUpperCase() === "YA" || Boolean(row.dismissed),
        isDeleted,
        createdAt,
        updatedAt,
      };

    case "feedbacks":
      return {
        id,
        reportId: String(row["ID Setoran/Report"] || row.reportId || ""),
        authorId: String(row["ID Penulis"] || row.authorId || ""),
        authorName: String(row["Nama Penulis"] || row.authorName || ""),
        authorRole: String(row["Role Penulis"] || row.authorRole || "upgrader"),
        type: String(row["Tipe Feedback"] || row.type || "praise"),
        content: String(row["Isi Evaluasi/Feedback"] || row.content || ""),
        isDeleted,
        createdAt,
        updatedAt,
      };

    case "comments":
      return {
        id,
        reportId: String(row["ID Setoran/Report"] || row.reportId || ""),
        authorId: String(row["ID Penulis"] || row.authorId || ""),
        authorName: String(row["Nama Penulis"] || row.authorName || ""),
        authorRole: String(row["Role Penulis"] || row.authorRole || "teacher"),
        content: String(row["Isi Komentar"] || row.content || ""),
        isDeleted,
        createdAt,
        updatedAt,
      };

    case "announcements":
      return {
        id,
        title: String(row["Judul Pengumuman"] || row.title || ""),
        content: String(row["Isi Pengumuman"] || row.content || ""),
        authorId: String(row["ID Penulis"] || row.authorId || ""),
        authorName: String(row["Nama Penulis"] || row.authorName || ""),
        pinned: String(row["Pin Status"] || row.pinned).toUpperCase() === "YA" || Boolean(row.pinned),
        audience: String(row["Audien Target"] || row.audience || "all"),
        isDeleted,
        createdAt,
        updatedAt,
      };

    case "notifications":
      return {
        id,
        title: String(row.Judul || row.title || ""),
        body: String(row["Pesan/Body"] || row.body || ""),
        level: String(row.Level || row.level || "info"),
        read: String(row["Status Dibaca"] || row.read).toUpperCase() === "YA" || Boolean(row.read),
        type: row["Tipe Notifikasi"] || row.type,
        userId: row["User ID Target"] || row.userId,
        reportId: row["Report ID"] || row.reportId,
        targetId: row["Target ID"] || row.targetId,
        isDeleted,
        createdAt,
        updatedAt,
      };

    case "achievements":
      return {
        id,
        teacherId: String(row["ID Guru"] || row.teacherId || ""),
        code: String(row["Kode Lencana"] || row.code || ""),
        title: String(row["Judul Lencana"] || row.title || ""),
        description: String(row.Deskripsi || row.description || ""),
        category: String(row.Kategori || row.category || "tahfizh"),
        points: Number(row["Poin XP"] || row.points || 0),
        unlockedAt: String(row["Tanggal Terbuka"] || row.unlockedAt || new Date().toISOString().slice(0, 10)),
        isDeleted,
        createdAt,
        updatedAt,
      };

    case "masterBadges":
      return {
        id: String(row["Kode Unik Lencana"] || row["Kode Lencana"] || row.code || row.ID || row.id || "").trim(),
        code: String(row["Kode Unik Lencana"] || row["Kode Lencana"] || row.code || row.ID || row.id || "").trim().toUpperCase(),
        title: String(row["Judul Lencana"] || row.title || row.Nama || "").trim(),
        description: String(row.Deskripsi || row.description || "").trim(),
        category: String(row.Kategori || row.category || "setoran").trim().toLowerCase(),
        icon: String(row.Icon || row.icon || "Award").trim(),
        points: Number(row["Poin XP"] || row.points || 0),
        isDeleted,
        createdAt,
        updatedAt,
      };

    case "activityLogs":
      return {
        id,
        action: String(row["Aksi (Action)"] || row.action || ""),
        description: String(row["Deskripsi Aktivitas"] || row.description || ""),
        actorId: String(row["ID Aktor"] || row.actorId || ""),
        actorName: String(row["Nama Aktor"] || row.actorName || ""),
        entity: String(row["Entitas Target"] || row.entity || ""),
        entityId: String(row["ID Entitas Target"] || row.entityId || ""),
        isDeleted,
        createdAt,
        updatedAt,
      };

    case "teacherRanks":
      return {
        id: String(row.ID || row.id || `rnk_${row.Level || row.level}`).trim(),
        level: Number(row.Level || row.level || 1),
        title: String(row["Nama Gelar"] || row.title || "").trim(),
        minXp: Number(row["Syarat Min XP"] || row.minXp || 0),
        badge: String(row["Badge Icon/Emoji"] || row.badge || "🌱").trim(),
        color: String(row["Warna Class"] || row.color || "text-slate-500").trim(),
        isDeleted,
        createdAt,
        updatedAt,
      };

    default:
      return { ...row, id, isDeleted, createdAt, updatedAt };
  }
}

/** Synchronizes all 10 collections safely from Google Apps Script to local repositories in parallel */
export async function syncAllFromGas(): Promise<{ ok: boolean; count?: number; error?: string }> {
  if (!isGasApiConfigured()) {
    return { ok: false, error: "URL API belum diisi di Pengaturan." };
  }

  try {
    const actions = [
      { action: "getTeachers", repoName: "teachers" },
      { action: "getReports", repoName: "reports" },
      { action: "getTargets", repoName: "targets" },
      { action: "getReminders", repoName: "reminders" },
      { action: "getFeedbacks", repoName: "feedbacks" },
      { action: "getComments", repoName: "comments" },
      { action: "getAnnouncements", repoName: "announcements" },
      { action: "getNotifications", repoName: "notifications" },
      { action: "getAchievements", repoName: "achievements" },
      { action: "getActivityLogs", repoName: "activityLogs" },
    ];

    let syncedCount = 0;
    let lastError = "";

    const results = await Promise.all(
      actions.map(async (item) => {
        try {
          const res = await fetchFromGas(item.action);
          if (res.ok && Array.isArray(res.data)) {
            const repo = allRepos.find((r) => r.name === item.repoName);
            if (repo) {
              const normalizedRows = res.data
                .map((row: any) => normalizeRow(item.repoName, row))
                .filter(Boolean);

              repo.replaceAll(normalizedRows);
              return { ok: true, error: undefined };
            }
          } else if (!res.ok && res.error) {
            return { ok: false, error: res.error };
          }
        } catch (err: any) {
          console.warn(`Sinkronisasi koleksi ${item.repoName} dilewati:`, err);
        }
        return { ok: false, error: undefined };
      }),
    );

    // Also sync masterBadges and teacherRanks directly to memory cache
    try {
      const remoteBadges = await fetchMasterBadgesFromGas();
      if (remoteBadges && remoteBadges.length > 0) {
        setMasterAchievementsCache(remoteBadges);
      }
      const remoteRanks = await fetchTeacherRanksFromGas();
      if (remoteRanks && remoteRanks.length > 0) {
        setTeacherRanksCache(remoteRanks);
      }
    } catch {}

    for (const r of results) {
      if (r.ok) syncedCount++;
    }

    hydrateAll();
    try {
      evaluateAllTeachersAchievements();
      evaluateAutomaticNotifications();
    } catch {}

    if (syncedCount === 0 && lastError) {
      return { ok: false, error: lastError };
    }

    return { ok: true, count: syncedCount };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Gagal sinkronisasi data dari Google Sheets." };
  }
}

/** Fetch masterBadges collection from Google Sheets */
export async function fetchMasterBadgesFromGas(): Promise<any[]> {
  if (!isGasApiConfigured()) return [];
  try {
    let res = await fetchFromGas("getMasterBadges");
    if (!res.ok || !Array.isArray(res.data) || res.data.length === 0) {
      res = await fetchFromGas("getAchievements");
    }
    if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
      const items = res.data
        .map((row: any) => normalizeRow("masterBadges", row))
        .filter((item: any) => Boolean(item && item.code && item.title));
      if (items.length > 0) return items;
    }
  } catch (err) {
    console.warn("Sinkronisasi masterBadges dilewati:", err);
  }
  return [];
}

/** Fetch teacherRanks collection from Google Sheets */
export async function fetchTeacherRanksFromGas(): Promise<TeacherRank[]> {
  if (!isGasApiConfigured()) return [];
  try {
    const res = await fetchFromGas("getTeacherRanks");
    if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
      const items = res.data
        .map((row: any) => normalizeRow("teacherRanks", row))
        .filter((item: any) => Boolean(item && item.title));
      if (items.length > 0) return items as TeacherRank[];
    }
  } catch (err) {
    console.warn("Sinkronisasi teacherRanks dilewati:", err);
  }
  return [];
}

/** Fetch xpConfig collection from Google Sheets */
export async function fetchXpConfigFromGas(): Promise<{
  xpPerSetoran: number;
  bonusGradeA: number;
  xpPerMustami: number;
  xpPerTarget: number;
}> {
  const defaultConfig = { xpPerSetoran: 30, bonusGradeA: 20, xpPerMustami: 25, xpPerTarget: 100 };
  if (!isGasApiConfigured()) return defaultConfig;

  try {
    const res = await fetchFromGas("getXpConfig");
    if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
      const row = res.data[0];
      if (row) {
        return {
          xpPerSetoran: Number(row["XP Per Setoran"] || row.xpPerSetoran || 30),
          bonusGradeA: Number(row["Bonus Grade A"] || row.bonusGradeA || 20),
          xpPerMustami: Number(row["XP Per Mustami"] || row.xpPerMustami || 25),
          xpPerTarget: Number(row["XP Per Target"] || row.xpPerTarget || 100),
        };
      }
    }
  } catch (err) {
    console.warn("Sinkronisasi xpConfig dilewati:", err);
  }
  return defaultConfig;
}

/** Save updated xpConfig to Google Sheets via Apps Script API */
export async function saveXpConfigToGas(config: {
  xpPerSetoran: number;
  bonusGradeA: number;
  xpPerMustami: number;
  xpPerTarget: number;
}): Promise<boolean> {
  if (!isGasApiConfigured()) return false;
  const res = await postToGas("updateXpConfig", config);
  return res.ok;
}

/** Login via Google Apps Script API */
export async function loginWithGas(
  username: string,
  password: string,
): Promise<{ ok: boolean; user?: Teacher; error?: string }> {
  if (!isGasApiConfigured()) {
    return { ok: false, error: "API Google Apps Script belum dikonfigurasi." };
  }

  const res = await postToGas<any>("login", { username, password });
  const rawUser = (res as any).user || res.data?.user;

  if (res.ok && rawUser) {
    const user = normalizeRow("teachers", rawUser) as Teacher;

    if (user && (user.id || user.username)) {
      setSession({ userId: String(user.id || user.username || ""), loggedInAt: new Date().toISOString() });
      return { ok: true, user };
    }
  }

  return { ok: false, error: res.error || "Username atau password salah." };
}

/** Format item row with mapped Indonesian keys for Google Sheets */
export function toGasRow(repoName: string, item: any): Record<string, any> {
  if (!item) return {};

  const id = item.id;
  const createdAt = formatDateDDMMYYYY(item.createdAt || new Date().toISOString());
  const updatedAt = formatDateDDMMYYYY(item.updatedAt || new Date().toISOString());
  const statusDihapus = item.isDeleted ? "YA" : "TIDAK";

  switch (repoName) {
    case "teachers":
      return {
        ID: id,
        "Nama Guru": item.name || "",
        Username: item.username || "",
        Gender: item.gender || "ustadz",
        Role: item.role || "teacher",
        Jabatan: item.position || "",
        Spesialisasi: item.specialization || "",
        "Level Target": item.level || "",
        "No HP": item.phone || "",
        Status: item.status || "aktif",
        "Tanggal Bergabung": formatDateDDMMYYYY(item.joinedAt),
        Password: item.password || "griya123",
        "Status Dihapus": statusDihapus,
        "Created At": createdAt,
        "Updated At": updatedAt,
      };

    case "reports":
      return {
        ID: id,
        Tanggal: formatDateDDMMYYYY(item.date),
        "ID Guru Dinilai": item.teacherId || "",
        "Nama Penyetor": item.teacherName || "",
        "ID Mustami": item.mustamiId || "",
        "Nama Mustami": item.mustamiName || "",
        Materi: item.material || "",
        "Rincian Materi": item.materialDetail || "",
        "Referensi Ayat/Halaman": item.reference || "",
        "Nilai Grade": parseGrade(item.grade),
        "PR/Tugas": item.homework || "",
        "Status PR": item.homework ? (item.homeworkDone ? "PR Selesai" : "PR Belum Selesai") : "Tidak Ada PR",
        "Catatan Mustami": item.mustamiNote || "",
        "Status Laporan": item.status || "verified",
        "Status Dihapus": statusDihapus,
        "Created At": createdAt,
        "Updated At": updatedAt,
      };

    case "targets":
      return {
        ID: id,
        "ID Guru": item.teacherId || "",
        "Judul Target": item.title || "",
        Deskripsi: item.description || "",
        Periode: item.period || "",
        Status: item.status || "",
        "Target Value": item.targetValue || 0,
        "Current Value": item.currentValue || 0,
        Satuan: item.unit || "Halaman",
        "Tanggal Mulai": formatDateDDMMYYYY(item.startDate),
        "Tenggat (Due Date)": formatDateDDMMYYYY(item.dueDate),
        "Created By": item.createdBy || "",
        "Status Dihapus": statusDihapus,
        "Created At": createdAt,
        "Updated At": updatedAt,
      };

    case "reminders":
      return {
        ID: id,
        "ID Target": item.targetId || "",
        "ID Guru": item.teacherId || "",
        "Judul Pengingat": item.title || "",
        Pesan: item.message || "",
        Frekuensi: item.frequency || "",
        "Tanggal Diingatkan": formatDateDDMMYYYY(item.remindAt),
        "Status Selesai (Dismissed)": item.dismissed ? "YA" : "TIDAK",
        "Status Dihapus": statusDihapus,
        "Created At": createdAt,
        "Updated At": updatedAt,
      };

    case "feedbacks":
      return {
        ID: id,
        "ID Setoran/Report": item.reportId || "",
        "ID Penulis": item.authorId || "",
        "Nama Penulis": item.authorName || "",
        "Role Penulis": item.authorRole || "",
        "Tipe Feedback": item.type || "",
        "Isi Evaluasi/Feedback": item.content || "",
        "Status Dihapus": statusDihapus,
        "Created At": createdAt,
        "Updated At": updatedAt,
      };

    case "comments":
      return {
        ID: id,
        "ID Setoran/Report": item.reportId || "",
        "ID Penulis": item.authorId || "",
        "Nama Penulis": item.authorName || "",
        "Role Penulis": item.authorRole || "",
        "Isi Komentar": item.content || "",
        "Status Dihapus": statusDihapus,
        "Created At": createdAt,
        "Updated At": updatedAt,
      };

    case "announcements":
      return {
        ID: id,
        "Judul Pengumuman": item.title || "",
        "Isi Pengumuman": item.content || "",
        "ID Penulis": item.authorId || "",
        "Nama Penulis": item.authorName || "",
        "Pin Status": item.pinned ? "YA" : "TIDAK",
        "Audien Target": item.audience || "all",
        "Status Dihapus": statusDihapus,
        "Created At": createdAt,
        "Updated At": updatedAt,
      };

    case "notifications":
      return {
        ID: id,
        Judul: item.title || "",
        "Pesan/Body": item.body || "",
        Level: item.level || "info",
        "Status Dibaca": item.read ? "YA" : "TIDAK",
        "Tipe Notifikasi": item.type || "",
        "User ID Target": item.userId || "",
        "Report ID": item.reportId || "",
        "Target ID": item.targetId || "",
        "Status Dihapus": statusDihapus,
        "Created At": createdAt,
        "Updated At": updatedAt,
      };

    case "achievements":
      return {
        ID: id,
        "ID Guru": item.teacherId || "",
        "Kode Lencana": item.code || "",
        "Judul Lencana": item.title || "",
        Deskripsi: item.description || "",
        Kategori: item.category || "",
        "Poin XP": item.points || 0,
        "Tanggal Terbuka": formatDateDDMMYYYY(item.unlockedAt),
        "Status Dihapus": statusDihapus,
        "Created At": createdAt,
        "Updated At": updatedAt,
      };

    case "masterBadges":
      return {
        ID: item.code || item.id,
        "Kode Unik Lencana": item.code || "",
        "Judul Lencana": item.title || "",
        Deskripsi: item.description || "",
        Kategori: item.category || "setoran",
        Icon: item.icon || "Award",
        "Poin XP": item.points || 0,
        "Status Dihapus": statusDihapus,
        "Created At": createdAt,
        "Updated At": updatedAt,
      };

    case "activityLogs":
      return {
        ID: id,
        "Aksi (Action)": item.action || "",
        "Deskripsi Aktivitas": item.description || "",
        "ID Aktor": item.actorId || "",
        "Nama Aktor": item.actorName || "",
        "Entitas Target": item.entity || "",
        "ID Entitas Target": item.entityId || "",
        "Status Dihapus": statusDihapus,
        "Created At": createdAt,
        "Updated At": updatedAt,
      };

    case "teacherRanks":
      return {
        ID: item.id || `rnk_${item.level}`,
        Level: Number(item.level || 1),
        "Nama Gelar": item.title || "",
        "Syarat Min XP": Number(item.minXp || 0),
        "Badge Icon/Emoji": item.badge || "🌱",
        "Warna Class": item.color || "text-slate-500",
        "Status Dihapus": statusDihapus,
        "Created At": createdAt,
        "Updated At": updatedAt,
      };

    default:
      return { ID: id, ...item, "Status Dihapus": statusDihapus, "Created At": createdAt, "Updated At": updatedAt };
  }
}

/** Pushes local creation, edit, or delete mutation to Google Apps Script API in background */
export async function pushMutationToGas(
  repoName: string,
  mutationType: "create" | "update" | "delete",
  item: any,
): Promise<void> {
  const itemId = item?.id || item?.code || item?.ID;
  if (!isGasApiConfigured() || !item || !itemId) return;

  const gasData = toGasRow(repoName, item);

  let action = "";
  if (repoName === "masterBadges") {
    action = mutationType === "create" ? "addMasterBadge" : mutationType === "update" ? "updateMasterBadge" : "deleteMasterBadge";
  } else if (repoName === "teacherRanks") {
    action = mutationType === "create" ? "addTeacherRank" : mutationType === "update" ? "updateTeacherRank" : "deleteTeacherRank";
  } else if (mutationType === "create") {
    switch (repoName) {
      case "teachers":
        action = "addTeacher";
        break;
      case "reports":
        action = "addReport";
        break;
      case "targets":
        action = "addTarget";
        break;
      case "reminders":
        action = "addReminder";
        break;
      case "feedbacks":
        action = "addFeedback";
        break;
      case "comments":
        action = "addComment";
        break;
      case "announcements":
        action = "addAnnouncement";
        break;
      case "notifications":
        action = "addNotification";
        break;
      case "achievements":
        action = "addAchievement";
        break;
      case "activityLogs":
        action = "addActivityLog";
        break;
    }
  } else if (mutationType === "update") {
    switch (repoName) {
      case "teachers":
        action = "updateTeacher";
        break;
      case "reports":
        action = "updateReport";
        break;
      case "targets":
        action = "updateTarget";
        break;
      case "announcements":
        action = "updateAnnouncement";
        break;
      default:
        action = `update${repoName.charAt(0).toUpperCase() + repoName.slice(1)}`;
        break;
    }
  } else if (mutationType === "delete") {
    switch (repoName) {
      case "teachers":
        action = "deleteTeacher";
        break;
      case "reports":
        action = "deleteReport";
        break;
      case "targets":
        action = "deleteTarget";
        break;
      case "announcements":
        action = "deleteAnnouncement";
        break;
      default:
        action = `delete${repoName.charAt(0).toUpperCase() + repoName.slice(1)}`;
        break;
    }
  }

  if (!action) return;

  try {
    const res = await postToGas(action, { id: itemId, data: gasData });
    if (res.ok) {
      console.log(`[GAS Sync] ${mutationType} ${repoName} (${item.id}) pushed to Google Sheets successfully.`);
    } else {
      console.warn(`[GAS Sync Warning] Failed pushing ${repoName}:`, res.error);
    }
  } catch (err) {
    console.warn(`[GAS Sync Error] Failed pushing ${repoName}:`, err);
  }
}

/** Request password reset to Google Apps Script (writes to passwordResets sheet) */
export async function requestPasswordReset(username: string, name: string, phone: string): Promise<GasResponse> {
  if (!isGasApiConfigured()) {
    return { ok: false, error: "API Google Apps Script belum dikonfigurasi." };
  }
  return postToGas("requestPasswordReset", {
    username,
    name,
    phone,
    requestedAt: new Date().toISOString(),
    status: "Pending",
  });
}
