import { activityRepo, notificationRepo } from "@/lib/data/repositories";
import type { ActivityLog, NotificationItem, NotificationType } from "@/lib/data/types";

export function notify(input: {
  title: string;
  body: string;
  level?: NotificationItem["level"] | undefined;
  type?: NotificationType | undefined;
  userId?: string | undefined;
  reportId?: string | undefined;
  targetId?: string | undefined;
  feedbackId?: string | undefined;
  commentId?: string | undefined;
  reminderId?: string | undefined;
  achievementId?: string | undefined;
  announcementId?: string | undefined;
}): NotificationItem {
  return notificationRepo.create({
    title: input.title,
    body: input.body,
    level: input.level ?? "info",
    read: false,
    ...(input.type ? { type: input.type } : {}),
    ...(input.userId ? { userId: input.userId } : {}),
    ...(input.reportId ? { reportId: input.reportId } : {}),
    ...(input.targetId ? { targetId: input.targetId } : {}),
    ...(input.feedbackId ? { feedbackId: input.feedbackId } : {}),
    ...(input.commentId ? { commentId: input.commentId } : {}),
    ...(input.reminderId ? { reminderId: input.reminderId } : {}),
    ...(input.achievementId ? { achievementId: input.achievementId } : {}),
    ...(input.announcementId ? { announcementId: input.announcementId } : {}),
  });
}

export function logActivity(input: {
  action: string;
  description: string;
  actorId?: string | undefined;
  actorName?: string | undefined;
  entity?: string | undefined;
  entityId?: string | undefined;
}) {
  return activityRepo.create({
    action: input.action,
    description: input.description,
    ...(input.actorId ? { actorId: input.actorId } : {}),
    ...(input.actorName ? { actorName: input.actorName } : {}),
    ...(input.entity ? { entity: input.entity } : {}),
    ...(input.entityId ? { entityId: input.entityId } : {}),
  });
}

export function notificationsFor(rows: NotificationItem[], userId?: string, userName?: string): NotificationItem[] {
  if (!userId) return [];
  const nameNorm = userName ? userName.trim().toLowerCase() : "";
  return rows
    .filter((n) => {
      if (!n) return false;
      if (n.userId) return n.userId === userId;
      if (nameNorm && (n.body?.toLowerCase().includes(nameNorm) || n.title?.toLowerCase().includes(nameNorm))) {
        return true;
      }
      if (n.type === "ANNOUNCEMENT_CREATED" || n.type === "SYSTEM") {
        return true;
      }
      return false;
    })
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

export function markAsRead(id: string): NotificationItem | undefined {
  return notificationRepo.update(id, { read: true });
}

export function markAllAsRead(userId?: string): void {
  const all = notificationRepo.list();
  for (const n of all) {
    if (!n.read && (!n.userId || n.userId === userId)) {
      notificationRepo.update(n.id, { read: true });
    }
  }
}

export function deleteNotification(id: string): void {
  notificationRepo.remove(id);
}

export function clearAllNotifications(userId?: string): void {
  const all = notificationRepo.list();
  for (const n of all) {
    if (!n.userId || n.userId === userId) {
      notificationRepo.remove(n.id);
    }
  }
}

export function listActivityLogs(
  logs: ActivityLog[],
  limit = 20,
  userId?: string,
  userName?: string,
): ActivityLog[] {
  const nameNorm = userName ? userName.trim().toLowerCase() : "";
  const filtered = logs.filter((log) => {
    if (!log) return false;
    if (!userId) return true;
    if (log.actorId === userId) return true;
    if (nameNorm && (log.description?.toLowerCase().includes(nameNorm) || log.actorName?.toLowerCase().includes(nameNorm))) {
      return true;
    }
    return false;
  });
  return [...filtered].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, limit);
}
