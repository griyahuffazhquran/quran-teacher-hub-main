import { useEffect, useSyncExternalStore } from "react";
import {
  getAutoSyncState,
  initAutoSyncManager,
  subscribeAutoSync,
  triggerSync,
  type AutoSyncState,
} from "@/lib/services/auto-sync-service";

export function useAutoSync(): AutoSyncState & { triggerSync: typeof triggerSync } {
  useEffect(() => {
    initAutoSyncManager();
  }, []);

  const state = useSyncExternalStore(
    subscribeAutoSync,
    getAutoSyncState,
    getAutoSyncState,
  );

  return { ...state, triggerSync };
}
