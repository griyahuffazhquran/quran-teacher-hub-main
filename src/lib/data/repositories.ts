import { createRepository } from "./repository";
import { seedNotifications, seedReports, seedTargets, seedTeachers } from "./seed";
import { resetAllData } from "./storage";
import type { NotificationItem, Report, Target, Teacher } from "./types";

export const teacherRepo = createRepository<Teacher>("teachers", seedTeachers);
export const reportRepo = createRepository<Report>("reports", seedReports);
export const targetRepo = createRepository<Target>("targets", seedTargets);
export const notificationRepo = createRepository<NotificationItem>(
  "notifications",
  seedNotifications,
);

export const allRepos = [teacherRepo, reportRepo, targetRepo, notificationRepo] as const;

export function hydrateAll() {
  for (const repo of allRepos) repo.hydrate();
}

export function resetDemoData() {
  resetAllData(allRepos.map((r) => r.name));
  teacherRepo.replaceAll(seedTeachers());
  reportRepo.replaceAll(seedReports());
  targetRepo.replaceAll(seedTargets());
  notificationRepo.replaceAll(seedNotifications());
}
