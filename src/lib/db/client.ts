import Database from "better-sqlite3";
import path from "node:path";

let dbInstance: Database.Database | null = null;

/**
 * Mendapatkan koneksi database SQLite lokal (Singleton pattern).
 */
export function getLocalDb(): Database.Database {
  if (!dbInstance) {
    const dbPath = path.resolve(process.cwd(), "db", "quran_teacher.db");
    dbInstance = new Database(dbPath);
    dbInstance.pragma("foreign_keys = ON;");
  }
  return dbInstance;
}

/**
 * Helper pembungkus query SQL lokal yang fleksibel.
 * Dirancang agar mudah dipetakan ke Supabase SDK client di kemudian hari.
 */
export const dbClient = {
  selectFrom: <T = unknown>(tableName: string, whereClause = "", params: unknown[] = []): T[] => {
    const db = getLocalDb();
    const sql = `SELECT * FROM ${tableName} ${whereClause ? `WHERE ${whereClause}` : ""}`;
    return db.prepare(sql).all(...params) as T[];
  },

  insertInto: <T extends Record<string, unknown>>(tableName: string, data: T): void => {
    const db = getLocalDb();
    const keys = Object.keys(data);
    const columns = keys.join(", ");
    const placeholders = keys.map(() => "?").join(", ");
    const values = Object.values(data);

    const sql = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;
    db.prepare(sql).run(...values);
  },

  updateTable: <T extends Record<string, unknown>>(
    tableName: string,
    id: string,
    data: T
  ): void => {
    const db = getLocalDb();
    const keys = Object.keys(data);
    const setClause = keys.map((key) => `${key} = ?`).join(", ");
    const values = [...Object.values(data), id];

    const sql = `UPDATE ${tableName} SET ${setClause}, updated_at = datetime('now') WHERE id = ?`;
    db.prepare(sql).run(...values);
  },

  deleteFrom: (tableName: string, id: string): void => {
    const db = getLocalDb();
    const sql = `DELETE FROM ${tableName} WHERE id = ?`;
    db.prepare(sql).run(id);
  },
};
