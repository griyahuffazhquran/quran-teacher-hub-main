import { useEffect, useState, useSyncExternalStore } from "react";
import type { Teacher } from "@/lib/data/types";
import {
  evaluatePresenceStatus,
  readPresenceMap,
  removePresence,
  sendHeartbeat,
  subscribePresence,
  type UserPresenceRecord,
} from "@/lib/services/presence-service";

/** Hook to start heartbeating for the current logged-in user. */
export function usePresenceTracker(user: Teacher | undefined) {
  useEffect(() => {
    if (!user || typeof window === "undefined") return;

    // Send immediate heartbeat on mount
    sendHeartbeat(user);

    // Periodic heartbeat every 4 seconds
    const interval = setInterval(() => {
      sendHeartbeat(user);
    }, 4000);

    // Handle visibility changes (tab active vs background)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        sendHeartbeat(user, "idle");
      } else {
        sendHeartbeat(user, "online");
      }
    };

    // Handle page unload / close
    const handleUnload = () => {
      sendHeartbeat(user, "offline");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
    };
  }, [user]);
}

/** Hook for Upgraders to monitor live presence map. */
export function usePresenceList() {
  const presenceMap = useSyncExternalStore(
    subscribePresence,
    readPresenceMap,
    readPresenceMap,
  );

  const [now, setNow] = useState(Date.now());

  // Force re-render every 3 seconds to keep "last seen" relative times and online states fresh
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 3000);
    return () => clearInterval(timer);
  }, []);

  return { presenceMap, now, evaluatePresenceStatus };
}
