import { getGasApiUrl, isGasApiConfigured } from "@/lib/config/api-config";
import { allRepos, hydrateAll } from "@/lib/data/repositories";
import { parseGrade } from "@/lib/data/selectors";
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
        grade: parseGrade(row["Nilai Grade"] || row.grade),
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
          if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
            const repo = allRepos.find((r) => r.name === item.repoName);
            if (repo) {
              const normalizedRows = res.data
                .map((row: any) => normalizeRow(item.repoName, row))
                .filter(Boolean);

              if (normalizedRows.length > 0) {
                repo.replaceAll(normalizedRows);
                return { ok: true, error: undefined };
              }
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

    for (const r of results) {
      if (r.ok) syncedCount++;
      if (r.error) lastError = r.error;
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

/** Format item row with mapped Indonesian & camelCase keys for Google Sheets */
export function toGasRow(repoName: string, item: any): Record<string, any> {
  if (!item) return {};

  const id = item.id;
  const createdAt = item.createdAt || new Date().toISOString();
  const updatedAt = item.updatedAt || new Date().toISOString();

  switch (repoName) {
    case "teachers":
      return {
        ID: id,
        id,
        "Nama Guru": item.name || "",
        name: item.name || "",
        Username: item.username || "",
        username: item.username || "",
        Gender: item.gender || "ustadz",
        gender: item.gender || "ustadz",
        Role: item.role || "teacher",
        role: item.role || "teacher",
        Jabatan: item.position || "",
        position: item.position || "",
        Spesialisasi: item.specialization || "",
        specialization: item.specialization || "",
        "Level Target": item.level || "",
        level: item.level || "",
        "No HP": item.phone || "",
        phone: item.phone || "",
        Status: item.status || "aktif",
        status: item.status || "aktif",
        "Tanggal Bergabung": item.joinedAt || "",
        joinedAt: item.joinedAt || "",
        "Created At": createdAt,
        createdAt,
        "Updated At": updatedAt,
        updatedAt,
        Password: item.password || "griya123",
        password: item.password || "griya123",
      };

    case "reports":
      return {
        ID: id,
        id,
        Tanggal: item.date || "",
        date: item.date || "",
        "ID Guru Dinilai": item.teacherId || "",
        teacherId: item.teacherId || "",
        "Nama Guru Dinilai": item.teacherName || "",
        "ID Mustami": item.mustamiId || "",
        mustamiId: item.mustamiId || "",
        "Nama Mustami": item.mustamiName || "",
        mustamiName: item.mustamiName || "",
        Materi: item.material || "",
        material: item.material || "",
        "Rincian Materi": item.materialDetail || "",
        materialDetail: item.materialDetail || "",
        "Referensi Ayat/Halaman": item.reference || "",
        reference: item.reference || "",
        "Nilai Grade": parseGrade(item.grade),
        grade: parseGrade(item.grade),
        "PR/Tugas": item.homework || "",
        homework: item.homework || "",
        "Status PR": item.homework ? (item.homeworkDone ? "PR Selesai" : "PR Belum Selesai") : "Tidak Ada PR",
        homeworkDone: Boolean(item.homeworkDone),
        "Catatan Mustami": item.mustamiNote || "",
        mustamiNote: item.mustamiNote || "",
        "Status Laporan": item.status || "verified",
        status: item.status || "verified",
        isDeleted: Boolean(item.isDeleted),
        "Created At": createdAt,
        createdAt,
        "Updated At": updatedAt,
        updatedAt,
      };

    case "targets":
      return {
        ID: id,
        id,
        "ID Guru": item.teacherId || "",
        teacherId: item.teacherId || "",
        "Judul Target": item.title || "",
        title: item.title || "",
        Deskripsi: item.description || "",
        description: item.description || "",
        Periode: item.period || "",
        period: item.period || "",
        Status: item.status || "",
        status: item.status || "",
        "Target Value": item.targetValue || 0,
        targetValue: item.targetValue || 0,
        "Current Value": item.currentValue || 0,
        currentValue: item.currentValue || 0,
        Satuan: item.unit || "Halaman",
        unit: item.unit || "Halaman",
        "Tanggal Mulai": item.startDate || "",
        startDate: item.startDate || "",
        "Tenggat (Due Date)": item.dueDate || "",
        dueDate: item.dueDate || "",
        "Created By": item.createdBy || "",
        createdBy: item.createdBy || "",
        isDeleted: Boolean(item.isDeleted),
        "Created At": createdAt,
        createdAt,
        "Updated At": updatedAt,
        updatedAt,
      };

    case "reminders":
      return {
        ID: id,
        id,
        "ID Target": item.targetId || "",
        targetId: item.targetId || "",
        "ID Guru": item.teacherId || "",
        teacherId: item.teacherId || "",
        "Judul Pengingat": item.title || "",
        title: item.title || "",
        Pesan: item.message || "",
        message: item.message || "",
        Frekuensi: item.frequency || "",
        frequency: item.frequency || "",
        "Tanggal Diingatkan": item.remindAt || "",
        remindAt: item.remindAt || "",
        "Status Selesai (Dismissed)": item.dismissed ? "YA" : "TIDAK",
        dismissed: Boolean(item.dismissed),
        "Created At": createdAt,
        createdAt,
        "Updated At": updatedAt,
        updatedAt,
      };

    case "feedbacks":
      return {
        ID: id,
        id,
        "ID Setoran/Report": item.reportId || "",
        reportId: item.reportId || "",
        "ID Penulis": item.authorId || "",
        authorId: item.authorId || "",
        "Nama Penulis": item.authorName || "",
        authorName: item.authorName || "",
        "Role Penulis": item.authorRole || "",
        authorRole: item.authorRole || "",
        "Tipe Feedback": item.type || "",
        type: item.type || "",
        "Isi Evaluasi/Feedback": item.content || "",
        content: item.content || "",
        "Created At": createdAt,
        createdAt,
        "Updated At": updatedAt,
        updatedAt,
      };

    case "comments":
      return {
        ID: id,
        id,
        "ID Setoran/Report": item.reportId || "",
        reportId: item.reportId || "",
        "ID Penulis": item.authorId || "",
        authorId: item.authorId || "",
        "Nama Penulis": item.authorName || "",
        authorName: item.authorName || "",
        "Role Penulis": item.authorRole || "",
        authorRole: item.authorRole || "",
        "Isi Komentar": item.content || "",
        content: item.content || "",
        "Created At": createdAt,
        createdAt,
        "Updated At": updatedAt,
        updatedAt,
      };

    case "announcements":
      return {
        ID: id,
        id,
        "Judul Pengumuman": item.title || "",
        title: item.title || "",
        "Isi Pengumuman": item.content || "",
        content: item.content || "",
        "ID Penulis": item.authorId || "",
        authorId: item.authorId || "",
        "Nama Penulis": item.authorName || "",
        authorName: item.authorName || "",
        "Pin Status": item.pinned ? "YA" : "TIDAK",
        pinned: Boolean(item.pinned),
        "Audien Target": item.audience || "all",
        audience: item.audience || "all",
        "Created At": createdAt,
        createdAt,
        "Updated At": updatedAt,
        updatedAt,
      };

    case "notifications":
      return {
        ID: id,
        id,
        Judul: item.title || "",
        title: item.title || "",
        "Pesan/Body": item.body || "",
        body: item.body || "",
        Level: item.level || "info",
        level: item.level || "info",
        "Status Dibaca": item.read ? "YA" : "TIDAK",
        read: Boolean(item.read),
        "Tipe Notifikasi": item.type || "",
        type: item.type || "",
        "User ID Target": item.userId || "",
        userId: item.userId || "",
        "Report ID": item.reportId || "",
        reportId: item.reportId || "",
        "Target ID": item.targetId || "",
        targetId: item.targetId || "",
        "Created At": createdAt,
        createdAt,
        "Updated At": updatedAt,
        updatedAt,
      };

    case "achievements":
      return {
        ID: id,
        id,
        "ID Guru": item.teacherId || "",
        teacherId: item.teacherId || "",
        "Kode Lencana": item.code || "",
        code: item.code || "",
        "Judul Lencana": item.title || "",
        title: item.title || "",
        Deskripsi: item.description || "",
        description: item.description || "",
        Kategori: item.category || "",
        category: item.category || "",
        "Poin XP": item.points || 0,
        points: item.points || 0,
        "Tanggal Terbuka": item.unlockedAt || "",
        unlockedAt: item.unlockedAt || "",
        "Created At": createdAt,
        createdAt,
        "Updated At": updatedAt,
        updatedAt,
      };

    case "activityLogs":
      return {
        ID: id,
        id,
        "Aksi (Action)": item.action || "",
        action: item.action || "",
        "Deskripsi Aktivitas": item.description || "",
        description: item.description || "",
        "ID Aktor": item.actorId || "",
        actorId: item.actorId || "",
        "Nama Aktor": item.actorName || "",
        actorName: item.actorName || "",
        "Entitas Target": item.entity || "",
        entity: item.entity || "",
        "ID Entitas Target": item.entityId || "",
        entityId: item.entityId || "",
        "Created At": createdAt,
        createdAt,
        "Updated At": updatedAt,
        updatedAt,
      };

    default:
      return { ID: id, id, ...item, "Created At": createdAt, "Updated At": updatedAt };
  }
}

/** Pushes local creation, edit, or delete mutation to Google Apps Script API in background */
export async function pushMutationToGas(
  repoName: string,
  mutationType: "create" | "update" | "delete",
  item: any,
): Promise<void> {
  if (!isGasApiConfigured() || !item || !item.id) return;

  const gasData = toGasRow(repoName, item);

  let action = "";
  if (mutationType === "create") {
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
    const res = await postToGas(action, { id: item.id, data: gasData });
    if (res.ok) {
      console.log(`[GAS Sync] ${mutationType} ${repoName} (${item.id}) pushed to Google Sheets successfully.`);
    } else {
      console.warn(`[GAS Sync Warning] Failed pushing ${repoName}:`, res.error);
    }
  } catch (err) {
    console.warn(`[GAS Sync Error] Failed pushing ${repoName}:`, err);
  }
}
