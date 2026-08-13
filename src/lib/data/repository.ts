import { createId, ensureSchemaVersion, nowISO, readCollection, writeCollection } from "./storage";
import type { ID } from "./types";

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
};

export function createRepository<T extends Base>(
  name: string,
  seed: () => T[] = () => [],
): Repository<T> {
  let rows: T[] = [];
  let hydrated = false;
  const listeners = new Set<() => void>();

  const emit = () => listeners.forEach((l) => l());

  const persist = () => {
    writeCollection(name, rows);
    emit();
  };

  const hydrate = () => {
    if (hydrated || typeof window === "undefined") return;
    ensureSchemaVersion();
    const stored = readCollection<T>(name);
    if (stored) {
      rows = stored;
    } else {
      rows = seed();
      writeCollection(name, rows);
    }
    hydrated = true;
    emit();
  };

  return {
    name,
    hydrate,
    list: () => rows,
    get: (id) => rows.find((r) => r.id === id),
    create: (input) => {
      const row = {
        ...(input as object),
        id: createId(name.slice(0, 3)),
        createdAt: nowISO(),
        updatedAt: nowISO(),
      } as T;
      rows = [row, ...rows];
      persist();
      return row;
    },
    update: (id, patch) => {
      let updated: T | undefined;
      rows = rows.map((r) => {
        if (r.id !== id) return r;
        updated = { ...r, ...patch, updatedAt: nowISO() } as T;
        return updated;
      });
      if (updated) persist();
      return updated;
    },
    remove: (id) => {
      rows = rows.filter((r) => r.id !== id);
      persist();
    },
    replaceAll: (next) => {
      rows = next;
      persist();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
