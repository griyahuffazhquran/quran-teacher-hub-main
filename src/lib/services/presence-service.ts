import { STORAGE_PREFIX } from "@/lib/data/storage";
import type { Teacher, UserRole } from "@/lib/data/types";

const PRESENCE_KEY = `${STORAGE_PREFIX}:active_presence_v1`;
const CHANNEL_NAME = "quran_hub_presence_channel";

export type PresenceStatus = "online" | "idle" | "offline";

export type UserPresenceRecord = {
  tabId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  gender?: string;
  position?: string;
  currentPath: string;
  deviceInfo: string;
  lastSeenAt: number; // Date.now() timestamp
  status: PresenceStatus;
};

let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  } catch {
    broadcastChannel = null;
  }
}

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

// Tab ID singleton
const TAB_ID =
  typeof window !== "undefined"
    ? window.name || (window.name = `tab_${Math.random().toString(36).slice(2, 9)}_${Date.now()}`)
    : "server";

export function getDeviceInfo(): string {
  if (typeof window === "undefined" || !navigator) return "Desk/Mobile";
  const ua = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const os = /iPhone|iPad|iPod/i.test(ua)
    ? "iOS"
    : /Android/i.test(ua)
    ? "Android"
    : /Windows/i.test(ua)
    ? "Windows"
    : /Mac/i.test(ua)
    ? "macOS"
    : "Linux";

  const browser = /Chrome/i.test(ua) && !/Edg/i.test(ua)
    ? "Chrome"
    : /Safari/i.test(ua) && !/Chrome/i.test(ua)
    ? "Safari"
    : /Firefox/i.test(ua)
    ? "Firefox"
    : /Edg/i.test(ua)
    ? "Edge"
    : "Browser";

  return `${isMobile ? "HP / Tablet" : "Desktop"} (${os} - ${browser})`;
}

export function readPresenceMap(): Record<string, UserPresenceRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PRESENCE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, UserPresenceRecord>;
  } catch {
    return {};
  }
}

export function writePresenceMap(map: Record<string, UserPresenceRecord>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PRESENCE_KEY, JSON.stringify(map));
    broadcastChannel?.postMessage({ type: "PRESENCE_UPDATED", timestamp: Date.now() });
    emit();
  } catch {
    // ignore storage quota errors
  }
}

/** Update heartbeat for the current logged-in user. */
export function sendHeartbeat(user: Teacher, statusOverride?: PresenceStatus) {
  if (typeof window === "undefined" || !user) return;
  const map = readPresenceMap();
  const isVisible = document.visibilityState === "visible";
  const status: PresenceStatus =
    statusOverride ?? (isVisible ? "online" : "idle");

  const record: UserPresenceRecord = {
    tabId: TAB_ID,
    userId: user.id,
    userName: user.name,
    userRole: user.role ?? "teacher",
    gender: user.gender,
    position: user.position || (user.role === "upgrader" ? "Upgrader / Pengurus" : "Guru Pengajar"),
    currentPath: window.location.pathname,
    deviceInfo: getDeviceInfo(),
    lastSeenAt: Date.now(),
    status,
  };

  map[user.id] = record;
  writePresenceMap(map);
}

/** Remove current user presence on logout or page unload. */
export function removePresence(userId: string) {
  if (typeof window === "undefined" || !userId) return;
  const map = readPresenceMap();
  if (map[userId]) {
    delete map[userId];
    writePresenceMap(map);
  }
}

/** Helper to categorize user presence. */
export function evaluatePresenceStatus(record?: UserPresenceRecord): {
  isOnline: boolean;
  isIdle: boolean;
  isOffline: boolean;
  statusLabel: string;
} {
  if (!record) {
    return { isOnline: false, isIdle: false, isOffline: true, statusLabel: "Offline" };
  }

  const diffMs = Date.now() - record.lastSeenAt;
  const TIMEOUT_ONLINE = 15000; // 15 seconds
  const TIMEOUT_IDLE = 35000; // 35 seconds

  if (record.status === "offline" || diffMs > TIMEOUT_IDLE) {
    return { isOnline: false, isIdle: false, isOffline: true, statusLabel: "Offline" };
  }

  if (record.status === "idle" || !record.status || diffMs > TIMEOUT_ONLINE) {
    return { isOnline: false, isIdle: true, isOffline: false, statusLabel: "Latar Belakang / Idle" };
  }

  return { isOnline: true, isIdle: false, isOffline: false, statusLabel: "Online Aktif" };
}

export function subscribePresence(listener: () => void) {
  listeners.add(listener);

  const handleStorage = (ev: StorageEvent) => {
    if (ev.key === PRESENCE_KEY) {
      emit();
    }
  };

  const handleMessage = (ev: MessageEvent) => {
    if (ev.data?.type === "PRESENCE_UPDATED") {
      emit();
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
    broadcastChannel?.addEventListener("message", handleMessage);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
      broadcastChannel?.removeEventListener("message", handleMessage);
    }
  };
}
