/**
 * SSR-safe LocalStorage adapter with namespacing + schema versioning.
 * All persistence in the app goes through this module.
 */
export const STORAGE_PREFIX = "ghq";
export const SCHEMA_VERSION = 1;

const VERSION_KEY = `${STORAGE_PREFIX}:schema_version`;

export function storageKey(collection: string) {
  return `${STORAGE_PREFIX}:${collection}`;
}

function hasStorage(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

export function readCollection<T>(collection: string): T[] | null {
  if (!hasStorage()) return null;
  try {
    const raw = window.localStorage.getItem(storageKey(collection));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : null;
  } catch {
    return null;
  }
}

export function writeCollection<T>(collection: string, rows: T[]): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(storageKey(collection), JSON.stringify(rows));
  } catch {
    // storage full / blocked — keep in-memory state working
  }
}

export function ensureSchemaVersion(): void {
  if (!hasStorage()) return;
  try {
    const current = Number(window.localStorage.getItem(VERSION_KEY));
    if (current !== SCHEMA_VERSION) {
      window.localStorage.setItem(VERSION_KEY, String(SCHEMA_VERSION));
    }
  } catch {
    // ignore
  }
}

export function resetAllData(collections: string[]): void {
  if (!hasStorage()) return;
  for (const c of collections) {
    try {
      window.localStorage.removeItem(storageKey(c));
    } catch {
      // ignore
    }
  }
}

export function createId(prefix = "id"): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${rand}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}
