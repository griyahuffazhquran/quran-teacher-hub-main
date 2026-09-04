import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "quran_teacher.db");
const schemaPath = path.join(__dirname, "schema.sql");
const seedPath = path.join(__dirname, "seed.sql");

console.log("📦 Inisialisasi Database SQLite Lokal (15 Tabel)...");
console.log("Path:", dbPath);

const db = new Database(dbPath);

try {
  // Matikan FK constraint sementara saat re-seed batch
  db.pragma("foreign_keys = OFF;");

  console.log("⏳ Eksekusi Skema DDL (schema.sql)...");
  const schemaSql = fs.readFileSync(schemaPath, "utf-8");
  db.exec(schemaSql);

  console.log("🧹 Membersihkan Data Lama...");
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

  console.log("🌱 Menanamkan Seed Data (seed.sql)...");
  const seedSql = fs.readFileSync(seedPath, "utf-8");

  const runSeed = db.transaction(() => {
    db.exec(seedSql);
  });
  runSeed();

  // Aktifkan kembali FK constraint & lakukan validasi integritas data
  db.pragma("foreign_keys = ON;");
  const fkErrors = db.prepare("PRAGMA foreign_key_check;").all();
  if (fkErrors.length > 0) {
    throw new Error(`Integritas Foreign Key Gagal: ${JSON.stringify(fkErrors)}`);
  }

  console.log("✅ Database SQLite & Seed Data berhasil disiapkan!\n");

  const tables = [
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

  console.log("📊 Ringkasan Jumlah Data per Tabel (15 Tabel):");
  for (const table of tables) {
    const row = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number };
    console.log(`  - ${table.padEnd(16)}: ${row.count} baris`);
  }
} catch (error) {
  console.error("❌ Gagal menginisialisasi database:", error);
  process.exit(1);
} finally {
  db.close();
}
