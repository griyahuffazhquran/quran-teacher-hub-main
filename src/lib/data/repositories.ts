import { migrateReports } from "./migrations";
import { createRepository } from "./repository";
import {
  seedActivityLogs,
  seedNotifications,
  seedReports,
  seedTargets,
  seedTeachers,
} from "./seed";
import { resetAllData } from "./storage";
import type { ActivityLog, NotificationItem, Report, Target, Teacher } from "./types";

export const teacherRepo = createRepository<Teacher>("teachers", seedTeachers);
export const reportRepo = createRepository<Report>("reports", seedReports, migrateReports);
export const targetRepo = createRepository<Target>("targets", seedTargets);
export const notificationRepo = createRepository<NotificationItem>(
  "notifications",
  seedNotifications,
);
export const activityRepo = createRepository<ActivityLog>("activityLogs", seedActivityLogs);

export const allRepos = [
  teacherRepo,
  reportRepo,
  targetRepo,
  notificationRepo,
  activityRepo,
] as const;

export function hydrateAll() {
  for (const repo of allRepos) repo.hydrate();
  // Self-heal: If teachers repo is empty after hydration (e.g. empty/corrupted localStorage in sandboxed iframe), re-seed
  if (teacherRepo.list().length === 0) {
    teacherRepo.replaceAll(seedTeachers());
    reportRepo.replaceAll(seedReports());
    targetRepo.replaceAll(seedTargets());
    notificationRepo.replaceAll(seedNotifications());
    activityRepo.replaceAll(seedActivityLogs());
  }
}

export function resetDemoData() {
  resetAllData(allRepos.map((r) => r.name));
  teacherRepo.replaceAll(seedTeachers());
  reportRepo.replaceAll(seedReports());
  targetRepo.replaceAll(seedTargets());
  notificationRepo.replaceAll(seedNotifications());
  activityRepo.replaceAll(seedActivityLogs());
}
