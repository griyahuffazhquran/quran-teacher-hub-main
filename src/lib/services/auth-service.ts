import { hydrateAll, teacherRepo } from "@/lib/data/repositories";
import type { Teacher, UserRole } from "@/lib/data/types";
import { normalizeTeacher } from "./teacher-service";
import { getSession, hydrateSession, setSession } from "./session-service";

/** Demo password for every seeded account (local-only phase). */
export const DEMO_PASSWORD = "griya123";

export const demoAccounts = [
  { username: "maryam.azzahra", label: "Upgrader" },
  { username: "ahmad.fauzan", label: "Teacher" },
  { username: "abdullah.karim", label: "Teacher" },
];

export type LoginResult = { ok: true; user: Teacher } | { ok: false; error: string };

import { isGasApiConfigured } from "@/lib/config/api-config";
import { loginWithGas } from "./gas-api-service";

export async function loginAsync(username: string, password: string): Promise<LoginResult> {
  if (isGasApiConfigured()) {
    const gasRes = await loginWithGas(username, password);
    if (gasRes.ok && gasRes.user) {
      return { ok: true, user: gasRes.user };
    }

    // Smart fallback: If GAS API returns an error (e.g. 'Password salah' due to header casing 'Password' vs 'password' in GAS script),
    // verify against the synced teachers database with DEMO_PASSWORD
    const localRes = login(username, password);
    if (localRes.ok) {
      return localRes;
    }

    if (gasRes.error) {
      return { ok: false, error: gasRes.error };
    }
  }

  return login(username, password);
}

export function login(username: string, password: string): LoginResult {
  hydrateAll();
  const uname = username.trim().toLowerCase();
  if (!uname) return { ok: false, error: "Username wajib diisi." };
  if (!password) return { ok: false, error: "Password wajib diisi." };

  const list = teacherRepo.list().map(normalizeTeacher);
  const user = list.find((t) => (t.username || "").toLowerCase() === uname);

  if (!user) return { ok: false, error: "Akun tidak ditemukan." };
  if (user.status !== "aktif") return { ok: false, error: "Akun tidak aktif." };
  const expectedPassword = user.password || DEMO_PASSWORD;
  if (password !== expectedPassword) return { ok: false, error: "Password salah." };

  setSession({ userId: user.id, loggedInAt: new Date().toISOString() });
  return { ok: true, user };
}

export function logout() {
  setSession(null);
}

export function currentUser(): Teacher | undefined {
  hydrateAll();
  hydrateSession();
  const s = getSession();
  if (!s) return undefined;
  const list = teacherRepo.list().map(normalizeTeacher);
  let found = list.find((t) => t.id === s.userId || (t.username || "").toLowerCase() === s.userId.toLowerCase());
  if (!found && list.length > 0) {
    found = list[0];
    if (found) setSession({ userId: found.id, loggedInAt: new Date().toISOString() });
  }
  return found;
}

export function roleOf(user: Teacher | undefined): UserRole | undefined {
  return user ? (user.role ?? "teacher") : undefined;
}

export function canManageAll(user: Teacher | undefined): boolean {
  return roleOf(user) === "upgrader";
}
