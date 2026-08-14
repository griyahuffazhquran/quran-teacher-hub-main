import { teacherRepo } from "@/lib/data/repositories";
import type { Teacher, TeacherGender, TeacherStatus, UserRole } from "@/lib/data/types";

export type TeacherInput = {
  name: string;
  username: string;
  gender: TeacherGender;
  role: UserRole;
  position: string;
  specialization: string;
  level: string;
  phone?: string;
  joinedAt: string;
  status: TeacherStatus;
  photoUrl?: string;
};

export type ValidationResult = { ok: true } | { ok: false; errors: Record<string, string> };

const slug = (v: string) =>
  v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");

/** Fills defaults for rows persisted before Phase 2 fields existed. */
export function normalizeTeacher(
  t: Teacher,
): Required<Pick<Teacher, "username" | "role" | "position" | "specialization">> & Teacher {
  return {
    ...t,
    username: t.username || slug(t.name) || t.id,
    role: t.role ?? "teacher",
    position: t.position || (t.gender === "ustadz" ? "Ustadz" : "Ustadzah"),
    specialization: t.specialization || "Tahfizh Al-Qur'an",
  };
}

export function listTeachers(rows: Teacher[]): Teacher[] {
  return rows.map(normalizeTeacher);
}

export function validateTeacher(
  input: TeacherInput,
  existing: Teacher[],
  id?: string,
): ValidationResult {
  const errors: Record<string, string> = {};
  if (!input.name.trim()) errors["name"] = "Nama wajib diisi.";
  if (!input.username.trim()) errors["username"] = "Username wajib diisi.";
  else if (!/^[a-z0-9._-]{3,}$/i.test(input.username.trim()))
    errors["username"] = "Minimal 3 karakter, tanpa spasi.";
  else if (
    existing.some(
      (t) =>
        t.id !== id && (t.username ?? "").toLowerCase() === input.username.trim().toLowerCase(),
    )
  )
    errors["username"] = "Username sudah digunakan.";
  if (!input.position.trim()) errors["position"] = "Jabatan wajib diisi.";
  if (!input.specialization.trim()) errors["specialization"] = "Spesialisasi wajib diisi.";
  if (!input.joinedAt) errors["joinedAt"] = "Tanggal bergabung wajib diisi.";
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true };
}

function toRow(input: TeacherInput) {
  const phone = input.phone?.trim();
  const photoUrl = input.photoUrl?.trim();
  return {
    name: input.name.trim(),
    username: input.username.trim().toLowerCase(),
    gender: input.gender,
    role: input.role,
    position: input.position.trim(),
    specialization: input.specialization.trim(),
    level: input.level.trim() || "-",
    joinedAt: input.joinedAt,
    status: input.status,
    ...(phone ? { phone } : {}),
    ...(photoUrl ? { photoUrl } : {}),
  };
}

export function createTeacher(input: TeacherInput): Teacher {
  return teacherRepo.create(toRow(input));
}

export function updateTeacher(id: string, input: TeacherInput): Teacher | undefined {
  return teacherRepo.update(id, toRow(input));
}

export function patchTeacher(id: string, patch: Partial<Teacher>): Teacher | undefined {
  return teacherRepo.update(id, patch);
}

export function setTeacherStatus(id: string, status: TeacherStatus): Teacher | undefined {
  return teacherRepo.update(id, { status });
}

export const emptyTeacherInput = (): TeacherInput => ({
  name: "",
  username: "",
  gender: "ustadz",
  role: "teacher",
  position: "",
  specialization: "",
  level: "",
  phone: "",
  joinedAt: new Date().toISOString().slice(0, 10),
  status: "aktif",
  photoUrl: "",
});

export const toInput = (t: Teacher): TeacherInput => {
  const n = normalizeTeacher(t);
  return {
    name: n.name,
    username: n.username,
    gender: n.gender,
    role: n.role,
    position: n.position,
    specialization: n.specialization,
    level: n.level,
    phone: n.phone ?? "",
    joinedAt: n.joinedAt,
    status: n.status,
    photoUrl: n.photoUrl ?? "",
  };
};

export const initials = (name: string) =>
  name
    .replace(/^(Ust\.|Ustzh\.|Ustadz|Ustadzah)\s*/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
