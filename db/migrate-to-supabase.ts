import Database from "better-sqlite3";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://dijprlwjfwbnouezudzw.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_O7STh4gq_ooSfQYWbefY5A_JXQhOAsR";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const dbPath = path.resolve(process.cwd(), "db", "quran_teacher.db");
const sqliteDb = new Database(dbPath);

const TABLES_ORDER = [
  "teachers",
  "reports",
  "targets",
  "reminders",
  "feedbacks",
  "report_comments",
  "achievements",
  "announcements",
  "notifications",
  "activity_logs",
  "master_badges",
  "teacher_ranks",
  "xp_config",
  "password_resets",
  "user_presence",
];

const BOOLEAN_COLUMNS = new Set([
  "is_deleted",
  "homework_done",
  "pinned",
  "read",
  "dismissed",
]);

function safeIsoDate(val: any): string {
  if (!val) return new Date().toISOString();
  const s = String(val).trim();
  try {
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch {}
  return new Date().toISOString();
}

function normalizeRowForSupabase(row: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(row)) {
    if (val === undefined || val === null) {
      result[key] = null;
      continue;
    }
    if (BOOLEAN_COLUMNS.has(key)) {
      result[key] = Boolean(val);
    } else if (key === "created_at" || key === "updated_at") {
      result[key] = safeIsoDate(val);
    } else {
      result[key] = val;
    }
  }
  return result;
}

async function migrateData() {
  console.log("🚀 Memulai Migrasi Data dari SQLite Local ke Supabase Cloud...");
  console.log(`Supabase Project URL: ${SUPABASE_URL}`);

  let totalMigrated = 0;

  for (const table of TABLES_ORDER) {
    try {
      const rows = sqliteDb.prepare(`SELECT * FROM ${table}`).all() as Record<string, any>[];
      if (rows.length === 0) {
        console.log(`ℹ️ Table '${table}' kosong (0 rows), melewatinya...`);
        continue;
      }

      const normalizedRows = rows.map(normalizeRowForSupabase);
      console.log(`⏳ Migrasi ${rows.length} data ke tabel '${table}'...`);

      // Upsert in batches of 50
      const batchSize = 50;
      let successCount = 0;
      for (let i = 0; i < normalizedRows.length; i += batchSize) {
        const batch = normalizedRows.slice(i, i + batchSize);
        const { error } = await supabase.from(table).upsert(batch);
        if (error) {
          console.error(`❌ Gagal upsert tabel '${table}' (batch ${i}):`, error.message);
        } else {
          successCount += batch.length;
        }
      }

      totalMigrated += successCount;
      console.log(`✅ Tabel '${table}': ${successCount}/${rows.length} rows berhasil di-migrate/upsert.`);
    } catch (err: any) {
      console.error(`⚠️ Terjadi kesalahan saat membaca tabel SQLite '${table}':`, err?.message);
    }
  }

  console.log(`\n🎉 Migrasi selesai! Total ${totalMigrated} baris data berhasil ditransfer ke Supabase.`);
}

migrateData().catch(console.error);
