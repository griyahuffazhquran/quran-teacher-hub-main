import { getGasApiUrl, isGasApiConfigured } from "@/lib/config/api-config";
import { allRepos, hydrateAll } from "@/lib/data/repositories";
import type { Teacher } from "@/lib/data/types";
import { setSession } from "./session-service";

export type GasResponse<T = any> = {
  ok: boolean;
  data?: T;
  error?: string;
};

export async function fetchFromGas<T = any>(
  action: string,
  queryParams: Record<string, string> = {},
): Promise<GasResponse<T>> {
  const url = getGasApiUrl();
  if (!url) return { ok: false, error: "URL API Google Apps Script belum dikonfigurasi." };

  try {
    const params = new URLSearchParams({ action, ...queryParams });
    const response = await fetch(`${url}?${params.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return { ok: false, error: `HTTP error! status: ${response.status}` };
    }

    const json = await response.json();
    return json;
  } catch (err: any) {
    return { ok: false, error: err?.message || "Gagal terhubung ke Google Apps Script API." };
  }
}

export async function postToGas<T = any>(
  action: string,
  payload: Record<string, any> = {},
): Promise<GasResponse<T>> {
  const url = getGasApiUrl();
  if (!url) return { ok: false, error: "URL API Google Apps Script belum dikonfigurasi." };

  try {
    // GAS Web App CORS redirection requires text/plain or standard fetch without custom headers
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, ...payload }),
    });

    if (!response.ok) {
      return { ok: false, error: `HTTP error! status: ${response.status}` };
    }

    const json = await response.json();
    return json;
  } catch (err: any) {
    return { ok: false, error: err?.message || "Gagal mengirim data ke Google Apps Script API." };
  }
}

/** Synchronizes all 10 collections from Google Apps Script to local repositories */
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

    for (const item of actions) {
      const res = await fetchFromGas(item.action);
      if (res.ok && Array.isArray(res.data)) {
        const repo = allRepos.find((r) => r.name === item.repoName);
        if (repo && res.data.length > 0) {
          // Normalize GAS keys if needed (GAS column names might be title-case or match CSV headers)
          const normalizedRows = res.data.map((row: any) => {
            if (item.repoName === "teachers") {
              return {
                id: row.ID || row.id,
                name: row["Nama Guru"] || row.name,
                username: row.Username || row.username,
                gender: row.Gender || row.gender || "ustadz",
                role: row.Role || row.role || "teacher",
                position: row.Jabatan || row.position || "",
                specialization: row.Spesialisasi || row.specialization || "",
                level: row["Level Target"] || row.level || "Juz 1",
                phone: row["No HP"] || row.phone || "",
                status: row.Status || row.status || "aktif",
                joinedAt: row["Tanggal Bergabung"] || row.joinedAt || new Date().toISOString().slice(0, 10),
                createdAt: row["Created At"] || row.createdAt || new Date().toISOString(),
                updatedAt: row["Updated At"] || row.updatedAt || new Date().toISOString(),
              };
            }
            // For other repos, handle key mapping gracefully
            const mapped: Record<string, any> = {};
            for (const key of Object.keys(row)) {
              const camelKey = key
                .replace(/^ID$/, "id")
                .replace(/ Created At$/, "createdAt")
                .replace(/ Updated At$/, "updatedAt");
              mapped[camelKey] = row[key];
            }
            return { ...row, ...mapped };
          });

          repo.replaceAll(normalizedRows);
          syncedCount++;
        }
      }
    }

    hydrateAll();
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

  const res = await postToGas<{ user: Teacher }>("login", { username, password });

  if (res.ok && res.data?.user) {
    const raw = res.data.user;
    const user: Teacher = {
      id: raw.id || (raw as any).ID,
      name: raw.name || (raw as any)["Nama Guru"],
      username: raw.username || (raw as any).Username,
      gender: raw.gender || (raw as any).Gender || "ustadz",
      role: raw.role || (raw as any).Role || "teacher",
      position: raw.position || (raw as any).Jabatan || "",
      specialization: raw.specialization || (raw as any).Spesialisasi || "",
      level: raw.level || (raw as any)["Level Target"] || "Juz 1",
      phone: raw.phone || (raw as any)["No HP"] || "",
      status: raw.status || (raw as any).Status || "aktif",
      joinedAt: raw.joinedAt || (raw as any)["Tanggal Bergabung"] || new Date().toISOString().slice(0, 10),
      createdAt: raw.createdAt || (raw as any)["Created At"] || new Date().toISOString(),
      updatedAt: raw.updatedAt || (raw as any)["Updated At"] || new Date().toISOString(),
    };

    setSession({ userId: user.id, loggedInAt: new Date().toISOString() });
    return { ok: true, user };
  }

  return { ok: false, error: res.error || "Gagal login ke Google Apps Script." };
}
