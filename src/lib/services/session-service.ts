import { STORAGE_PREFIX } from "@/lib/data/storage";

const SESSION_KEY = `${STORAGE_PREFIX}:session`;

export type Session = { userId: string; loggedInAt: string } | null;

let session: Session = null;
let hydrated = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

export function hydrateSession() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    session = raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    session = null;
  }
  emit();
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
