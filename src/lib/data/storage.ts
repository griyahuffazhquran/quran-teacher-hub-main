/**
 * SSR-safe & iframe-sandbox resilient LocalStorage adapter with namespacing.
 * Works seamlessly in local environment as well as sandboxed previews (e.g. Lovable editor).
 */
export const STORAGE_PREFIX = "ghq";
export const SCHEMA_VERSION = 3;

const VERSION_KEY = `${STORAGE_PREFIX}:schema_version`;

export function storageKey(collection: string) {
  return `${STORAGE_PREFIX}:${collection}`;
}

let storageAvailable: boolean | null = null;

function hasStorage(): boolean {
  if (typeof window === "undefined") return false;
  if (storageAvailable !== null) return storageAvailable;

  try {
    const testKey = `${STORAGE_PREFIX}:_test_key_`;
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }

  return storageAvailable;
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
    // storage full or iframe restricted — keep working in memory
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
