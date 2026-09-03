import { isGasApiConfigured } from "@/lib/config/api-config";
import { syncAllFromGas } from "./gas-api-service";

export type AutoSyncStatus = "idle" | "syncing" | "synced" | "error";

export type AutoSyncState = {
  status: AutoSyncStatus;
  lastSyncedAt: Date | null;
  errorMessage: string | null;
  syncCount: number;
};

let state: AutoSyncState = {
  status: "idle",
  lastSyncedAt: null,
  errorMessage: null,
  syncCount: 0,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function getAutoSyncState(): AutoSyncState {
  return state;
}

export function subscribeAutoSync(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let syncPromise: Promise<{ ok: boolean; count?: number; error?: string }> | null = null;

export async function triggerSync(): Promise<{ ok: boolean; count?: number; error?: string }> {
  if (!isGasApiConfigured()) {
    state = { ...state, status: "idle", errorMessage: null };
    notify();
    return { ok: false, error: "URL API belum dikonfigurasi." };
  }

  if (syncPromise) return syncPromise;

  state = { ...state, status: "syncing", errorMessage: null };
  notify();

  syncPromise = (async () => {
    try {
      const res = await syncAllFromGas();
      if (res.ok) {
        state = {
          status: "synced",
          lastSyncedAt: new Date(),
          errorMessage: null,
          syncCount: state.syncCount + 1,
        };
      } else {
        state = {
          ...state,
          status: "error",
          errorMessage: res.error || "Gagal sinkronisasi.",
        };
      }
      notify();
      return res;
    } catch (err: any) {
      state = {
        ...state,
        status: "error",
        errorMessage: err?.message || "Kesalahan koneksi.",
      };
      notify();
      return { ok: false, error: err?.message || "Kesalahan koneksi." };
    } finally {
      syncPromise = null;
    }
  })();

  return syncPromise;
}

let isInitialized = false;
let pollingTimer: ReturnType<typeof setInterval> | null = null;

export function initAutoSyncManager(pollingIntervalMs = 6000) {
  if (isInitialized || typeof window === "undefined") return;
  isInitialized = true;

  // Initial sync on startup
  if (isGasApiConfigured()) {
    void triggerSync();
  }

  // Periodic background polling
  pollingTimer = setInterval(() => {
    if (isGasApiConfigured() && document.visibilityState === "visible") {
      void triggerSync();
    }
  }, pollingIntervalMs);

  // Sync on tab focus / visibility change
  const syncIfVisible = () => {
    if ((document.visibilityState === "visible" || document.hasFocus()) && isGasApiConfigured()) {
      void triggerSync();
    }
  };

  window.addEventListener("visibilitychange", syncIfVisible);
  window.addEventListener("focus", syncIfVisible);
  window.addEventListener("online", syncIfVisible);
}
