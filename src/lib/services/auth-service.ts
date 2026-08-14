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

export function login(username: string, password: string): LoginResult {
  hydrateAll();
  const uname = username.trim().toLowerCase();
  if (!uname) return { ok: false, error: "Username wajib diisi." };
  if (!password) return { ok: false, error: "Password wajib diisi." };

  const user = teacherRepo
    .list()
    .map(normalizeTeacher)
    .find((t) => t.username.toLowerCase() === uname);

  if (!user) return { ok: false, error: "Akun tidak ditemukan." };
  if (user.status !== "aktif") return { ok: false, error: "Akun tidak aktif." };
  if (password !== DEMO_PASSWORD) return { ok: false, error: "Password salah." };

  setSession({ userId: user.id, loggedInAt: new Date().toISOString() });
  return { ok: true, user };
}

export function logout() {
  setSession(null);
}

export function currentUser(): Teacher | undefined {
  hydrateSession();
  const s = getSession();
  if (!s) return undefined;
  const found = teacherRepo.list().find((t) => t.id === s.userId);
  return found ? normalizeTeacher(found) : undefined;
}

export function roleOf(user: Teacher | undefined): UserRole | undefined {
  return user ? (user.role ?? "teacher") : undefined;
}

export function canManageAll(user: Teacher | undefined): boolean {
  return roleOf(user) === "upgrader";
}
