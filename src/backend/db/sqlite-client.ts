import Database from "better-sqlite3";
import path from "node:path";

let dbInstance: Database.Database | null = null;

export function getSqliteDb(): Database.Database {
  if (!dbInstance) {
    const dbPath = path.resolve(process.cwd(), "db", "quran_teacher.db");
    dbInstance = new Database(dbPath);
    dbInstance.pragma("foreign_keys = ON;");
  }
  return dbInstance;
}

/**
 * Utility: Converts snake_case string to camelCase
 */
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Utility: Converts camelCase string to snake_case
 */
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Convert database row object keys (snake_case) to camelCase for API consumers
 */
export function rowToCamelCase<T = Record<string, any>>(row: Record<string, any> | undefined): T | null {
  if (!row || typeof row !== "object") return null;
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(row)) {
    const camelKey = toCamelCase(key);
    // Convert SQLite 1/0 integers for boolean fields
    if (
      (key.startsWith("is_") || key.endsWith("_done") || key === "pinned" || key === "dismissed" || key === "read") &&
      typeof val === "number"
    ) {
      result[camelKey] = Boolean(val);
    } else {
      result[camelKey] = val;
    }
  }
  return result as T;
}

/**
 * Convert frontend entity object keys (camelCase) to snake_case for SQLite queries
 */
export function entityToSnakeCase(data: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val === undefined) continue;
    const snakeKey = toSnakeCase(key);
    if (typeof val === "boolean") {
      result[snakeKey] = val ? 1 : 0;
    } else {
      result[snakeKey] = val;
    }
  }
  return result;
}

/** Map collection / endpoint names to SQLite table names */
const TABLE_NAME_MAP: Record<string, string> = {
  teachers: "teachers",
  reports: "reports",
  targets: "targets",
  reminders: "reminders",
  feedbacks: "feedbacks",
  comments: "report_comments",
  reportComments: "report_comments",
  achievements: "achievements",
  announcements: "announcements",
  notifications: "notifications",
  activityLogs: "activity_logs",
  activity_logs: "activity_logs",
  masterBadges: "master_badges",
  master_badges: "master_badges",
  teacherRanks: "teacher_ranks",
  teacher_ranks: "teacher_ranks",
  xpConfig: "xp_config",
  xp_config: "xp_config",
  passwordResets: "password_resets",
  password_resets: "password_resets",
  userPresence: "user_presence",
  user_presence: "user_presence",
};

export function resolveTableName(name: string): string {
  return TABLE_NAME_MAP[name] || name;
}

/**
 * Generic SQLite CRUD Access Layer
 */
export const sqliteDal = {
  findAll: <T = any>(tableName: string, filters: Record<string, any> = {}): T[] => {
    const db = getSqliteDb();
    const table = resolveTableName(tableName);

    const whereClauses: string[] = [];
    const params: any[] = [];

    // Process filters
    for (const [key, val] of Object.entries(filters)) {
      if (val === undefined || val === null || val === "") continue;
      const col = toSnakeCase(key);

      if (key === "search") {
        // Search text filter
        if (table === "teachers") {
          whereClauses.push("(name LIKE ? OR username LIKE ? OR phone LIKE ?)");
          const term = `%${val}%`;
          params.push(term, term, term);
        } else if (table === "reports") {
          whereClauses.push("(material_detail LIKE ? OR reference LIKE ? OR mustami_name LIKE ?)");
          const term = `%${val}%`;
          params.push(term, term, term);
        } else if (table === "targets" || table === "announcements") {
          whereClauses.push("(title LIKE ? OR description LIKE ?)");
          const term = `%${val}%`;
          params.push(term, term);
        }
      } else {
        whereClauses.push(`${col} = ?`);
        params.push(typeof val === "boolean" ? (val ? 1 : 0) : val);
      }
    }

    let sql = `SELECT * FROM ${table}`;
    if (whereClauses.length > 0) {
      sql += ` WHERE ${whereClauses.join(" AND ")}`;
    }

    // Default sorting
    if (["reports", "notifications", "activity_logs", "announcements"].includes(table)) {
      sql += ` ORDER BY created_at DESC`;
    } else if (table === "teachers") {
      sql += ` ORDER BY name ASC`;
    }

    const rows = db.prepare(sql).all(...params) as Record<string, any>[];
    return rows.map((r) => rowToCamelCase<T>(r)!) as T[];
  },

  findById: <T = any>(tableName: string, id: string): T | null => {
    const db = getSqliteDb();
    const table = resolveTableName(tableName);
    const sql = `SELECT * FROM ${table} WHERE id = ?`;
    const row = db.prepare(sql).get(id) as Record<string, any> | undefined;
    return rowToCamelCase<T>(row);
  },

  insert: <T = any>(tableName: string, data: Record<string, any>): T => {
    const db = getSqliteDb();
    const table = resolveTableName(tableName);
    const snakeData = entityToSnakeCase(data);

    if (!snakeData["created_at"]) snakeData["created_at"] = new Date().toISOString();
    if (!snakeData["updated_at"]) snakeData["updated_at"] = new Date().toISOString();

    const keys = Object.keys(snakeData);
    const columns = keys.join(", ");
    const placeholders = keys.map(() => "?").join(", ");
    const values = Object.values(snakeData);

    const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
    db.prepare(sql).run(...values);

    const insertedId = snakeData["id"] || data["id"];
    return (insertedId ? sqliteDal.findById<T>(tableName, String(insertedId)) : (data as any)) as T;
  },

  update: <T = any>(tableName: string, id: string, data: Record<string, any>): T | null => {
    const db = getSqliteDb();
    const table = resolveTableName(tableName);
    const snakeData = entityToSnakeCase(data);

    delete snakeData["id"];
    snakeData["updated_at"] = new Date().toISOString();

    const keys = Object.keys(snakeData);
    if (keys.length === 0) return sqliteDal.findById<T>(tableName, id);

    const setClause = keys.map((key) => `${key} = ?`).join(", ");
    const values = [...Object.values(snakeData), id];

    const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
    const res = db.prepare(sql).run(...values);

    if (res.changes === 0) return null;
    return sqliteDal.findById<T>(tableName, id);
  },

  delete: (tableName: string, id: string): boolean => {
    const db = getSqliteDb();
    const table = resolveTableName(tableName);

    // If table supports soft-delete (is_deleted), perform soft delete
    const columns = db.prepare(`PRAGMA table_info(${table});`).all() as { name: string }[];
    const hasIsDeleted = columns.some((c) => c.name === "is_deleted");

    if (hasIsDeleted) {
      const sql = `UPDATE ${table} SET is_deleted = 1, updated_at = ? WHERE id = ?`;
      const res = db.prepare(sql).run(new Date().toISOString(), id);
      return res.changes > 0;
    }

    const sql = `DELETE FROM ${table} WHERE id = ?`;
    const res = db.prepare(sql).run(id);
    return res.changes > 0;
  },
};
