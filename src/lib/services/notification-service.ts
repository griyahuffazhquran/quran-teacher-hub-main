import { activityRepo, notificationRepo } from "@/lib/data/repositories";
import type { NotificationItem, NotificationType } from "@/lib/data/types";

export function notify(input: {
  title: string;
  body: string;
  level?: NotificationItem["level"];
  type?: NotificationType;
  userId?: string;
  reportId?: string;
}): NotificationItem {
  return notificationRepo.create({
    title: input.title,
    body: input.body,
    level: input.level ?? "info",
    read: false,
    ...(input.type ? { type: input.type } : {}),
    ...(input.userId ? { userId: input.userId } : {}),
    ...(input.reportId ? { reportId: input.reportId } : {}),
  });
}

export function logActivity(input: {
  action: string;
  description: string;
  actorId?: string;
  entity?: string;
  entityId?: string;
}) {
  return activityRepo.create({
    action: input.action,
    description: input.description,
    ...(input.actorId ? { actorId: input.actorId } : {}),
    ...(input.entity ? { entity: input.entity } : {}),
    ...(input.entityId ? { entityId: input.entityId } : {}),
  });
}

export function notificationsFor(rows: NotificationItem[], userId?: string): NotificationItem[] {
  return rows.filter((n) => !n.userId || n.userId === userId);
}
