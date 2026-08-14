import { STORAGE_PREFIX } from "@/lib/data/storage";

const SESSION_KEY = `${STORAGE_PREFIX}:session`;

export type Session = { userId: string; loggedInAt: string } | null;

let session: Session = null;
let hydrated = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

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
    if (next) window.localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    else window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore storage errors, session stays in memory
  }
  emit();
}

export function subscribeSession(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
