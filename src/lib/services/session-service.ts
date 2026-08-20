import { STORAGE_PREFIX } from "@/lib/data/storage";

const SESSION_KEY = `${STORAGE_PREFIX}:session`;
const LAST_ACTIVITY_KEY = `${STORAGE_PREFIX}:last_activity_timestamp`;

/**
 * ============================================================================
 * PENGATURAN DURASI AUTO LOGOUT / KICK-OUT NON-AKTIVITAS (INACTIVITY TIMEOUT)
 * ============================================================================
 *
 * CARA MENGATUR DURASI SECARA MANUAL:
 * Ubah angka `INACTIVITY_TIMEOUT_HOURS` di bawah ini (dalam satuan jam).
 * Contoh:
 *   - 1     => 1 Jam Non-Aktif (Default)
 *   - 0.5   => 30 Menit Non-Aktif
 *   - 2     => 2 Jam Non-Aktif
 *   - 8     => 8 Jam Non-Aktif
 */
export const INACTIVITY_TIMEOUT_HOURS = 1;
export const INACTIVITY_TIMEOUT_MS = INACTIVITY_TIMEOUT_HOURS * 60 * 60 * 1000;

export type Session = { userId: string; loggedInAt: string } | null;

let session: Session = null;
let hydrated = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

/** Memperbarui timestamp aktivitas pengguna terbaru ke LocalStorage. */
export function touchLastActivity() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
  } catch {
    // ignore storage quota / sandbox error
  }
}

/** Membaca timestamp aktivitas pengguna terakhir. */
export function getLastActivity(): number {
  if (typeof window === "undefined") return Date.now();
  try {
    const raw = window.localStorage.getItem(LAST_ACTIVITY_KEY);
    if (raw) {
      const ts = Number(raw);
      if (!isNaN(ts) && ts > 0) return ts;
    }
  } catch {
    // ignore
  }
  return Date.now();
}

/** Memeriksa apakah sesi telah kedaluwarsa karena non-aktivitas melebihi batas jam. */
export function isSessionExpiredDueToInactivity(): boolean {
  if (typeof window === "undefined" || !session) return false;
  const lastActive = getLastActivity();
  const diff = Date.now() - lastActive;
  return diff >= INACTIVITY_TIMEOUT_MS;
}

export function hydrateSession() {
  if (typeof window === "undefined") return;
  if (!hydrated) {
    hydrated = true;
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Session;
        if (parsed && typeof parsed === "object" && parsed.userId) {
          session = parsed;
        }
      }
    } catch {
      // ignore iframe storage access errors, keep session in memory
    }
    emit();
  }
}

export function getSession(): Session {
  return session;
}

export function setSession(next: Session) {
  session = next;
  try {
    if (next) {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      touchLastActivity();
    } else {
      window.localStorage.removeItem(SESSION_KEY);
      window.localStorage.removeItem(LAST_ACTIVITY_KEY);
    }
  } catch {
    // ignore storage errors, session stays in memory
  }
  emit();
}

export function subscribeSession(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
