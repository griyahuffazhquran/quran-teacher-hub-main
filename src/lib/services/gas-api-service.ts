import { getGasApiUrl, isGasApiConfigured } from "@/lib/config/api-config";
import { allRepos, hydrateAll } from "@/lib/data/repositories";
import type { Teacher } from "@/lib/data/types";
import { setSession } from "./session-service";

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

  try {
    const params = new URLSearchParams({ action, ...queryParams });
    const fullUrl = `${url}?${params.toString()}`;
    const response = await fetch(fullUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

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
    return { ok: false, error: err?.message || "Gagal terhubung ke Google Apps Script API." };
  }
}

export async function postToGas<T = any>(
  action: string,
  payload: Record<string, any> = {},
): Promise<GasResponse<T>> {
  const rawUrl = getGasApiUrl();
  if (!rawUrl) return { ok: false, error: "URL API Google Apps Script belum dikonfigurasi." };

  const url = cleanUrl(rawUrl);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, ...payload }),
    });

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
    return { ok: false, error: err?.message || "Gagal mengirim data ke Google Apps Script API." };
  }
}

/** Normalize individual row objects safely based on repository collection name */
function normalizeRow(repoName: string, row: any): any {
  if (!row || typeof row !== "object") return null;

  const rawId = row.ID || row.id || row.Id;
  if (!rawId) return null;

  const id = String(rawId).trim();
  const createdAt = String(row["Created At"] || row.createdAt || new Date().toISOString());
  const updatedAt = String(row["Updated At"] || row.updatedAt || new Date().toISOString());

  switch (repoName) {
    case "teachers":
      return {
        id,
        name: String(row["Nama Guru"] || row.name || "Pengajar"),
        username: String(row.Username || row.username || "").toLowerCase(),
        gender: (row.Gender || row.gender || "ustadz") === "ustadzah" ? "ustadzah" : "ustadz",
        role: (row.Role || row.role || "teacher") === "upgrader" ? "upgrader" : "teacher",
        position: String(row.Jabatan || row.position || ""),
        specialization: String(row.Spesialisasi || row.specialization || ""),
        level: String(row["Level Target"] || row.level || "Juz 1"),
        phone: String(row["No HP"] || row.phone || ""),
        status: (row.Status || row.status || "aktif") === "nonaktif" ? "nonaktif" : "aktif",
        joinedAt: String(row["Tanggal Bergabung"] || row.joinedAt || new Date().toISOString().slice(0, 10)),
        createdAt,
        updatedAt,
      };

    case "reports":
      return {
        id,
        date: String(row.Tanggal || row.date || new Date().toISOString().slice(0, 10)),
        teacherId: String(row["ID Guru Dinilai"] || row.teacherId || ""),
        mustamiId: String(row["ID Mustami"] || row.mustamiId || ""),
        mustamiName: String(row["Nama Mustami"] || row.mustamiName || ""),
        material: String(row.Materi || row.material || "tahfizh"),
        materialDetail: String(row["Rincian Materi"] || row.materialDetail || ""),
        reference: String(row["Referensi Ayat/Halaman"] || row.reference || ""),
        grade: Number(row["Nilai Grade"] || row.grade || 0),
        homework: String(row["PR/Tugas"] || row.homework || ""),
        homeworkDone: String(row["Status PR"] || row.homeworkDone).includes("Selesai") || Boolean(row.homeworkDone),
        mustamiNote: String(row["Catatan Mustami"] || row.mustamiNote || ""),
        status: String(row["Status Laporan"] || row.status || "verified"),
        isDeleted: Boolean(row.isDeleted),
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
        isDeleted: Boolean(row.isDeleted),
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
        createdAt,
        updatedAt,
      };

    default:
      return { ...row, id, createdAt, updatedAt };
  }
}

/** Synchronizes all 10 collections safely from Google Apps Script to local repositories */
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

    for (const item of actions) {
      try {
        const res = await fetchFromGas(item.action);
        if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
          const repo = allRepos.find((r) => r.name === item.repoName);
          if (repo) {
            const normalizedRows = res.data
              .map((row: any) => normalizeRow(item.repoName, row))
              .filter(Boolean);

            if (normalizedRows.length > 0) {
              repo.replaceAll(normalizedRows);
              syncedCount++;
            }
          }
        } else if (!res.ok && res.error) {
          lastError = res.error;
        }
      } catch (err: any) {
        console.warn(`Sinkronisasi koleksi ${item.repoName} dilewati:`, err);
      }
    }

    hydrateAll();

    if (syncedCount === 0 && lastError) {
      return { ok: false, error: lastError };
    }

    return { ok: true, count: syncedCount };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Gagal sinkronisasi data dari Google Sheets." };
  }
}

/** Login via Google Apps Script API */
export async function loginWithGas(
  username: string,
  password: string,
): Promise<{ ok: boolean; user?: Teacher; error?: string }> {
  if (!isGasApiConfigured()) {
    return { ok: false, error: "API Google Apps Script belum dikonfigurasi." };
  }

  const res = await postToGas<{ user: any }>("login", { username, password });

  if (res.ok && res.data?.user) {
    const raw = res.data.user;
    const user = normalizeRow("teachers", raw) as Teacher;

    if (user && user.id) {
      setSession({ userId: user.id, loggedInAt: new Date().toISOString() });
      return { ok: true, user };
    }
  }

  return { ok: false, error: res.error || "Gagal login ke Google Apps Script." };
}
