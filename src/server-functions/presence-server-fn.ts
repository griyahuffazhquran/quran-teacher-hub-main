import { createServerFn } from "@tanstack/react-start";
import type { UserRole } from "@/lib/data/types";

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

export type HeartbeatPayload = {
  userId: string;
  userName: string;
  userRole: UserRole;
  gender?: string;
  position?: string;
  currentPath: string;
  deviceInfo: string;
  status: PresenceStatus;
};

// Global in-memory presence store on the server process
const globalServerPresenceMap: Record<string, UserPresenceRecord> = {};

export const pushHeartbeatServerFn = createServerFn({ method: "POST" })
  .validator((data: HeartbeatPayload) => data)
  .handler(async ({ data }) => {
    const now = Date.now();
    globalServerPresenceMap[data.userId] = {
      tabId: data.userId,
      userId: data.userId,
      userName: data.userName,
      userRole: data.userRole,
      gender: data.gender,
      position: data.position,
      currentPath: data.currentPath,
      deviceInfo: data.deviceInfo,
      lastSeenAt: now,
      status: data.status,
    };

    // Clean up stale sessions (> 45s)
    for (const id in globalServerPresenceMap) {
      if (now - globalServerPresenceMap[id].lastSeenAt > 45000) {
        delete globalServerPresenceMap[id];
      }
    }

    return { ok: true, presenceMap: globalServerPresenceMap };
  });

export const fetchPresenceMapServerFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const now = Date.now();
    for (const id in globalServerPresenceMap) {
      if (now - globalServerPresenceMap[id].lastSeenAt > 45000) {
        delete globalServerPresenceMap[id];
      }
    }
    return { ok: true, presenceMap: globalServerPresenceMap };
  });
