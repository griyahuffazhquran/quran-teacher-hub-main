import { z } from "zod";
import { sqliteDal } from "../db/sqlite-client";
import { supabaseDal } from "../db/supabase-client";

function generateId(prefix: string): string {
  const rand = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${Date.now()}_${rand}`;
}

/**
 * Validation Schemas for API Payloads
 */
const teacherSchema = z.object({
  name: z.string().min(1, "Nama guru wajib diisi"),
  gender: z.enum(["ustadz", "ustadzah"]),
  status: z.enum(["aktif", "nonaktif"]).default("aktif"),
  phone: z.string().optional().nullable(),
  level: z.string().default("Juz 30"),
  joinedAt: z.string().optional(),
  username: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  role: z.enum(["teacher", "upgrader"]).default("teacher"),
  position: z.string().optional().nullable(),
  specialization: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
});

const reportSchema = z.object({
  teacherId: z.string().min(1, "ID Guru wajib diisi"),
  mustamiId: z.string().min(1, "ID Mustami' wajib diisi"),
  mustamiName: z.string().min(1, "Nama Mustami' wajib diisi"),
  date: z.string().min(1, "Tanggal setoran wajib diisi"),
  material: z.enum(["tahfizh", "murajaah", "matn", "hadits", "lainnya"]),
  materialDetail: z.string().min(1, "Rincian materi wajib diisi"),
  reference: z.string().min(1, "Referensi ayat/halaman wajib diisi"),
  grade: z.enum(["A", "B", "C", "D"]),
  homework: z.string().optional().nullable(),
  homeworkDone: z.boolean().default(false),
  mustamiNote: z.string().optional().nullable(),
  status: z.enum(["selesai", "perlu_perbaikan", "pr_aktif"]).default("selesai"),
});

const targetSchema = z.object({
  teacherId: z.string().min(1, "ID Guru wajib diisi"),
  title: z.string().min(1, "Judul target wajib diisi"),
  description: z.string().optional().nullable(),
  period: z.enum(["bulanan", "semester", "tahunan"]),
  status: z.enum(["aktif", "tercapai", "gagal"]).default("aktif"),
  startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
  dueDate: z.string().min(1, "Tenggat waktu wajib diisi"),
  targetValue: z.number().min(1, "Target value minimal 1"),
  currentValue: z.number().default(0),
  unit: z.string().default("halaman"),
});

const reminderSchema = z.object({
  targetId: z.string().min(1, "Target ID wajib diisi"),
  teacherId: z.string().min(1, "ID Guru wajib diisi"),
  title: z.string().min(1, "Judul pengingat wajib diisi"),
  message: z.string().min(1, "Pesan pengingat wajib diisi"),
  frequency: z.enum(["once", "daily", "weekly"]),
  remindAt: z.string().min(1, "Waktu diingatkan wajib diisi"),
  dismissed: z.boolean().default(false),
});

const feedbackSchema = z.object({
  reportId: z.string().min(1, "Report ID wajib diisi"),
  authorId: z.string().min(1, "ID Penulis wajib diisi"),
  authorName: z.string().min(1, "Nama Penulis wajib diisi"),
  authorRole: z.enum(["teacher", "upgrader"]).default("upgrader"),
  type: z.enum(["mustami", "upgrader"]).default("mustami"),
  content: z.string().min(1, "Isi feedback wajib diisi"),
});

const commentSchema = z.object({
  reportId: z.string().min(1, "Report ID wajib diisi"),
  authorId: z.string().min(1, "ID Penulis wajib diisi"),
  authorName: z.string().min(1, "Nama Penulis wajib diisi"),
  authorRole: z.enum(["teacher", "upgrader"]).optional(),
  content: z.string().min(1, "Isi komentar wajib diisi"),
});

const announcementSchema = z.object({
  title: z.string().min(1, "Judul pengumuman wajib diisi"),
  content: z.string().min(1, "Isi pengumuman wajib diisi"),
  authorId: z.string().min(1, "ID Penulis wajib diisi"),
  authorName: z.string().min(1, "Nama Penulis wajib diisi"),
  pinned: z.boolean().default(false),
  audience: z.enum(["all", "teachers", "upgraders"]).default("all"),
  dueDate: z.string().optional().nullable(),
});

const notificationSchema = z.object({
  title: z.string().min(1, "Judul notifikasi wajib diisi"),
  body: z.string().min(1, "Isi notifikasi wajib diisi"),
  level: z.enum(["info", "warning", "success"]).default("info"),
  read: z.boolean().default(false),
  type: z.string().optional().nullable(),
  userId: z.string().optional().nullable(),
  reportId: z.string().optional().nullable(),
  targetId: z.string().optional().nullable(),
});

export const backendCrudService = {
  /**
   * List all items with optional filters
   */
  list: async (collectionName: string, filters: Record<string, any> = {}) => {
    try {
      return await supabaseDal.findAll(collectionName, filters);
    } catch (err) {
      console.warn(`[backendCrudService.list] Supabase fallback to SQLite for ${collectionName}:`, err);
      return sqliteDal.findAll(collectionName, filters);
    }
  },

  /**
   * Get single item by ID
   */
  getById: async (collectionName: string, id: string) => {
    try {
      const item = await supabaseDal.findById(collectionName, id);
      if (item) return item;
    } catch {}
    const item = sqliteDal.findById(collectionName, id);
    if (!item) {
      throw new Error(`Data ${collectionName} dengan ID '${id}' tidak ditemukan`);
    }
    return item;
  },

  /**
   * Create new item with validation & ID generation
   */
  create: async (collectionName: string, payload: Record<string, any>) => {
    let dataToInsert = { ...payload };

    // Validate payload if schema exists
    if (collectionName === "teachers") {
      dataToInsert = teacherSchema.parse(payload);
      if (!dataToInsert["id"]) dataToInsert["id"] = generateId("tea");
    } else if (collectionName === "reports") {
      dataToInsert = reportSchema.parse(payload);
      if (!dataToInsert["id"]) dataToInsert["id"] = generateId("rep");
    } else if (collectionName === "targets") {
      dataToInsert = targetSchema.parse(payload);
      if (!dataToInsert["id"]) dataToInsert["id"] = generateId("tar");
    } else if (collectionName === "reminders") {
      dataToInsert = reminderSchema.parse(payload);
      if (!dataToInsert["id"]) dataToInsert["id"] = generateId("rem");
    } else if (collectionName === "feedbacks") {
      dataToInsert = feedbackSchema.parse(payload);
      if (!dataToInsert["id"]) dataToInsert["id"] = generateId("fb");
    } else if (collectionName === "comments" || collectionName === "reportComments") {
      dataToInsert = commentSchema.parse(payload);
      if (!dataToInsert["id"]) dataToInsert["id"] = generateId("com");
    } else if (collectionName === "announcements") {
      dataToInsert = announcementSchema.parse(payload);
      if (!dataToInsert["id"]) dataToInsert["id"] = generateId("ann");
    } else if (collectionName === "notifications") {
      dataToInsert = notificationSchema.parse(payload);
      if (!dataToInsert["id"]) dataToInsert["id"] = generateId("not");
    } else {
      if (!dataToInsert["id"]) dataToInsert["id"] = generateId(collectionName.slice(0, 3));
    }

    if (payload["id"]) dataToInsert["id"] = payload["id"];

    try {
      return await supabaseDal.insert(collectionName, dataToInsert);
    } catch (err) {
      console.warn(`[backendCrudService.create] Supabase insert fallback to SQLite for ${collectionName}:`, err);
      return sqliteDal.insert(collectionName, dataToInsert);
    }
  },

  /**
   * Update item by ID
   */
  update: async (collectionName: string, id: string, payload: Record<string, any>) => {
    try {
      const updated = await supabaseDal.update(collectionName, id, payload);
      if (updated) return updated;
    } catch (err) {
      console.warn(`[backendCrudService.update] Supabase update fallback to SQLite for ${collectionName}:`, err);
    }
    const updated = sqliteDal.update(collectionName, id, payload);
    return updated;
  },

  /**
   * Delete item by ID
   */
  remove: async (collectionName: string, id: string) => {
    try {
      const success = await supabaseDal.delete(collectionName, id);
      if (success) return { id, deleted: true };
    } catch (err) {
      console.warn(`[backendCrudService.remove] Supabase delete fallback to SQLite for ${collectionName}:`, err);
    }
    const success = sqliteDal.delete(collectionName, id);
    return { id, deleted: success };
  },

  /**
   * Login Authentication
   */
  login: async (username: string, password: string) => {
    if (!username || !password) {
      throw new Error("Username dan password wajib diisi");
    }

    const cleanUsername = username.trim().toLowerCase();
    let teachers: any[] = [];
    try {
      teachers = await supabaseDal.findAll<any>("teachers", { username: cleanUsername });
    } catch {
      teachers = sqliteDal.findAll<any>("teachers", { username: cleanUsername });
    }

    if (teachers.length === 0) {
      throw new Error("Username atau password salah");
    }

    const user = teachers[0];
    const expectedPassword = String(user.password || "griya123").trim();

    if (password.trim() !== expectedPassword) {
      throw new Error("Username atau password salah");
    }

    if (user.status === "nonaktif") {
      throw new Error("Akun Anda saat ini dinonaktifkan");
    }

    return user;
  },
};
