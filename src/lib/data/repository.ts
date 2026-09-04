import { createId, ensureSchemaVersion, nowISO, readCollection, writeCollection } from "./storage";
import type { ID } from "./types";
import { backendApiService } from "@/lib/services/backend-api-service";

type Base = { id: ID; createdAt: string; updatedAt: string };

export type Repository<T extends Base> = {
  name: string;
  list: () => T[];
  get: (id: ID) => T | undefined;
  create: (input: Omit<T, "id" | "createdAt" | "updatedAt">) => T;
  update: (id: ID, patch: Partial<Omit<T, "id" | "createdAt">>) => T | undefined;
  remove: (id: ID) => void;
  replaceAll: (rows: T[]) => void;
  subscribe: (listener: () => void) => () => void;
  /** Loads persisted rows (or seeds on first run). Safe to call repeatedly. */
  hydrate: () => void;
  syncFromBackend: () => Promise<void>;
};

export function createRepository<T extends Base>(
  name: string,
  seed: () => T[] = () => [],
  /** Optional upgrade step for rows persisted with an older schema. */
  migrate: (rows: unknown[]) => T[] = (rows) => rows as T[],
): Repository<T> {
  let rows: T[] = seed();
  let hydrated = false;
  const listeners = new Set<() => void>();

  const emit = () => listeners.forEach((l) => l());

  const persist = () => {
    writeCollection(name, rows);
    emit();
  };

  const syncFromBackend = async () => {
    if (typeof window === "undefined") return;
    try {
      const remoteData = await backendApiService.list<T>(name);
      if (Array.isArray(remoteData) && remoteData.length > 0) {
        rows = remoteData;
        persist();
      }
    } catch (err) {
      console.warn(`[Repository ${name}] Sync dari backend API gagal, menggunakan cache lokal:`, err);
    }
  };

  const hydrate = () => {
    if (hydrated || typeof window === "undefined") return;
    ensureSchemaVersion();
    const stored = readCollection<unknown>(name);
    if (stored && stored.length > 0) {
      rows = migrate(stored);
      writeCollection(name, rows);
    } else {
      rows = seed();
      writeCollection(name, rows);
    }
    hydrated = true;
    emit();
    // Async background sync with SQLite backend API
    void syncFromBackend();
  };

  return {
    name,
    hydrate,
    syncFromBackend,
    list: () => {
      if (!hydrated && typeof window !== "undefined") {
        hydrate();
      }
      return rows;
    },
    get: (id) => {
      if (!hydrated && typeof window !== "undefined") {
        hydrate();
      }
      return rows.find((r) => r.id === id);
    },
    create: (input) => {
      if (!hydrated && typeof window !== "undefined") {
        hydrate();
      }
      const row = {
        ...(input as object),
        id: (input as any).id || createId(name.slice(0, 3)),
        createdAt: nowISO(),
        updatedAt: nowISO(),
      } as T;
      rows = [row, ...rows];
      persist();

      // Async push to local backend API (SQLite)
      backendApiService.create<T>(name, row).catch((err) => {
        console.error(`[Repository ${name}] Gagal simpan ke backend API:`, err);
      });

      return row;
    },
    update: (id, patch) => {
      if (!hydrated && typeof window !== "undefined") {
        hydrate();
      }
      let updated: T | undefined;
      rows = rows.map((r) => {
        if (r.id !== id) return r;
        updated = { ...r, ...patch, updatedAt: nowISO() } as T;
        return updated;
      });
      if (updated) {
        persist();

        // Async update to local backend API (SQLite)
        backendApiService.update<T>(name, id, updated).catch((err) => {
          console.error(`[Repository ${name}] Gagal update ke backend API:`, err);
        });
      }
      return updated;
    },
    remove: (id) => {
      if (!hydrated && typeof window !== "undefined") {
        hydrate();
      }
      let updated: T | undefined;
      rows = rows.map((r) => {
        if (r.id !== id) return r;
        updated = {
          ...r,
          isDeleted: true,
          status: (r as any).status === "aktif" ? "nonaktif" : (r as any).status,
          updatedAt: nowISO(),
        } as T;
        return updated;
      });
      if (updated) {
        persist();

        // Async soft delete in local backend API (SQLite)
        backendApiService.remove(name, id).catch((err) => {
          console.error(`[Repository ${name}] Gagal delete di backend API:`, err);
        });
      }
    },
    replaceAll: (next) => {
      rows = next;
      hydrated = true;
      persist();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
