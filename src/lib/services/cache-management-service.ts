import { STORAGE_PREFIX } from "@/lib/data/storage";
import { triggerSync } from "./auto-sync-service";

const APP_CACHE_VERSION_KEY = `${STORAGE_PREFIX}:app_cache_version`;
const CURRENT_APP_VERSION = "2.4.0"; // Incremented version to trigger auto cache clearing on all devices

/**
 * Checks and clears outdated device cache / local storage automatically on app update,
 * preserving current user session.
 */
export function autoClearStaleDeviceCache(): void {
  if (typeof window === "undefined") return;

  try {
    const savedVersion = localStorage.getItem(APP_CACHE_VERSION_KEY);

    if (savedVersion !== CURRENT_APP_VERSION) {
      console.log(`[Cache Manager] New app version detected (${CURRENT_APP_VERSION}). Clearing stale device cache...`);

      // Preserve active user session before clearing
      const sessionKey = `${STORAGE_PREFIX}:session`;
      const lastActivityKey = `${STORAGE_PREFIX}:last_activity_timestamp`;
      const savedSession = localStorage.getItem(sessionKey);
      const savedLastActivity = localStorage.getItem(lastActivityKey);

      // Clear browser Caches API if available
      if ("caches" in window) {
        caches.keys().then((names) => {
          names.forEach((name) => {
            caches.delete(name);
          });
        });
      }

      // Update version tag
      localStorage.setItem(APP_CACHE_VERSION_KEY, CURRENT_APP_VERSION);

      // Restore active user session so user doesn't get logged out unexpectedly
      if (savedSession) localStorage.setItem(sessionKey, savedSession);
      if (savedLastActivity) localStorage.setItem(lastActivityKey, savedLastActivity);

      console.log("[Cache Manager] Device cache cleared successfully.");
    }
  } catch (err) {
    console.warn("[Cache Manager] Failed to auto-clear cache:", err);
  }
}

/**
 * Manually or programmatically triggers a full cache reset and fresh data sync across the device.
 */
export async function clearAllDeviceCacheAndRefresh(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    // Clear Service Worker Caches
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }

    // Force trigger immediate re-sync from Google Apps Script
    await triggerSync();
  } catch (err) {
    console.error("[Cache Manager] Error resetting device cache:", err);
  }
}
