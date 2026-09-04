import { supabase } from "@/lib/config/supabase";

/** Map collection / endpoint names to Supabase PostgreSQL table names */
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
export function rowToCamelCase<T = Record<string, any>>(row: Record<string, any> | undefined | null): T | null {
  if (!row || typeof row !== "object") return null;
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(row)) {
    const camelKey = toCamelCase(key);
    result[camelKey] = val;
  }
  return result as T;
}

/**
 * Convert frontend entity object keys (camelCase) to snake_case for Supabase PostgreSQL queries
 */
export function entityToSnakeCase(data: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val === undefined) continue;
    const snakeKey = toSnakeCase(key);
    result[snakeKey] = val;
  }
  return result;
}

/**
 * Generic Supabase PostgreSQL Data Access Layer (DAL)
 */
export const supabaseDal = {
  findAll: async <T = any>(tableName: string, filters: Record<string, any> = {}): Promise<T[]> => {
    const table = resolveTableName(tableName);
    let query = supabase.from(table).select("*");

    // Process filters
    for (const [key, val] of Object.entries(filters)) {
      if (val === undefined || val === null || val === "") continue;
      const col = toSnakeCase(key);

      if (key === "search") {
        const term = `%${val}%`;
        if (table === "teachers") {
          query = query.or(`name.ilike.${term},username.ilike.${term},phone.ilike.${term}`);
        } else if (table === "reports") {
          query = query.or(`material_detail.ilike.${term},reference.ilike.${term},mustami_name.ilike.${term}`);
        } else if (table === "targets" || table === "announcements") {
          query = query.or(`title.ilike.${term},description.ilike.${term}`);
        }
      } else {
        query = query.eq(col, val);
      }
    }

    // Default sorting
    if (["reports", "notifications", "activity_logs", "announcements"].includes(table)) {
      query = query.order("created_at", { ascending: false });
    } else if (table === "teachers") {
      query = query.order("name", { ascending: true });
    }

    const { data, error } = await query;
    if (error) {
      console.error(`[SupabaseDal.findAll] ${table} error:`, error.message);
      throw new Error(`Supabase query failed: ${error.message}`);
    }

    return ((data || []).map((r) => rowToCamelCase<T>(r)!) as T[]);
  },

  findById: async <T = any>(tableName: string, id: string): Promise<T | null> => {
    const table = resolveTableName(tableName);
    const { data, error } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
    if (error) {
      console.error(`[SupabaseDal.findById] ${table} error:`, error.message);
      throw new Error(`Supabase query failed: ${error.message}`);
    }
    return rowToCamelCase<T>(data);
  },

  insert: async <T = any>(tableName: string, data: Record<string, any>): Promise<T> => {
    const table = resolveTableName(tableName);
    const snakeData = entityToSnakeCase(data);

    if (!snakeData["created_at"]) snakeData["created_at"] = new Date().toISOString();
    if (!snakeData["updated_at"]) snakeData["updated_at"] = new Date().toISOString();

    const { data: inserted, error } = await supabase.from(table).insert(snakeData).select("*").single();
    if (error) {
      console.error(`[SupabaseDal.insert] ${table} error:`, error.message);
      throw new Error(`Supabase insert failed: ${error.message}`);
    }

    return rowToCamelCase<T>(inserted)!;
  },

  update: async <T = any>(tableName: string, id: string, data: Record<string, any>): Promise<T | null> => {
    const table = resolveTableName(tableName);
    const snakeData = entityToSnakeCase(data);

    delete snakeData["id"];
    snakeData["updated_at"] = new Date().toISOString();

    const { data: updated, error } = await supabase.from(table).update(snakeData).eq("id", id).select("*").maybeSingle();
    if (error) {
      console.error(`[SupabaseDal.update] ${table} error:`, error.message);
      throw new Error(`Supabase update failed: ${error.message}`);
    }

    return rowToCamelCase<T>(updated);
  },

  delete: async (tableName: string, id: string): Promise<boolean> => {
    const table = resolveTableName(tableName);

    // Try soft delete first if is_deleted column exists, else hard delete
    const softDeleteRes = await supabase
      .from(table)
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (!softDeleteRes.error) return true;

    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      console.error(`[SupabaseDal.delete] ${table} error:`, error.message);
      throw new Error(`Supabase delete failed: ${error.message}`);
    }
    return true;
  },
};
