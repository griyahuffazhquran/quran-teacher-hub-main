import { activityRepo, notificationRepo } from "@/lib/data/repositories";
import type { ActivityLog, NotificationItem, NotificationType } from "@/lib/data/types";

export function notify(input: {
  title: string;
  body: string;
  level?: NotificationItem["level"];
  type?: NotificationType;
  userId?: string;
  reportId?: string;
  targetId?: string;
  feedbackId?: string;
  commentId?: string;
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
  });
}

export function logActivity(input: {
  action: string;
  description: string;
  actorId?: string;
  actorName?: string;
  entity?: string;
  entityId?: string;
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

export function notificationsFor(rows: NotificationItem[], userId?: string): NotificationItem[] {
  return rows
    .filter((n) => !n.userId || n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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

export function listActivityLogs(logs: ActivityLog[], limit = 20): ActivityLog[] {
  return [...logs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}
