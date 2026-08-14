import { migrateReports } from "./migrations";
import { createRepository } from "./repository";
import {
  seedAchievements,
  seedActivityLogs,
  seedComments,
  seedFeedbacks,
  seedNotifications,
  seedReminders,
  seedReports,
  seedTargets,
  seedTeachers,
} from "./seed";
import { resetAllData } from "./storage";
import type {
  Achievement,
  ActivityLog,
  Feedback,
  NotificationItem,
  Reminder,
  Report,
  ReportComment,
  Target,
  Teacher,
} from "./types";

export const teacherRepo = createRepository<Teacher>("teachers", seedTeachers);
export const reportRepo = createRepository<Report>("reports", seedReports, migrateReports);
export const targetRepo = createRepository<Target>("targets", seedTargets);
export const reminderRepo = createRepository<Reminder>("reminders", seedReminders);
export const achievementRepo = createRepository<Achievement>("achievements", seedAchievements);
export const feedbackRepo = createRepository<Feedback>("feedbacks", seedFeedbacks);
export const commentRepo = createRepository<ReportComment>("comments", seedComments);
export const notificationRepo = createRepository<NotificationItem>(
  "notifications",
  seedNotifications,
);
export const activityRepo = createRepository<ActivityLog>("activityLogs", seedActivityLogs);

export const allRepos = [
  teacherRepo,
  reportRepo,
  targetRepo,
  reminderRepo,
  achievementRepo,
  feedbackRepo,
  commentRepo,
  notificationRepo,
  activityRepo,
] as const;

export function hydrateAll() {
  for (const repo of allRepos) repo.hydrate();
  // Self-heal: If teachers repo is empty after hydration, re-seed
  if (teacherRepo.list().length === 0) {
    teacherRepo.replaceAll(seedTeachers());
    reportRepo.replaceAll(seedReports());
    targetRepo.replaceAll(seedTargets());
    reminderRepo.replaceAll(seedReminders());
    achievementRepo.replaceAll(seedAchievements());
    feedbackRepo.replaceAll(seedFeedbacks());
    commentRepo.replaceAll(seedComments());
    notificationRepo.replaceAll(seedNotifications());
    activityRepo.replaceAll(seedActivityLogs());
  }
}

export function resetDemoData() {
  resetAllData(allRepos.map((r) => r.name));
  teacherRepo.replaceAll(seedTeachers());
  reportRepo.replaceAll(seedReports());
  targetRepo.replaceAll(seedTargets());
  reminderRepo.replaceAll(seedReminders());
  achievementRepo.replaceAll(seedAchievements());
  feedbackRepo.replaceAll(seedFeedbacks());
  commentRepo.replaceAll(seedComments());
  notificationRepo.replaceAll(seedNotifications());
  activityRepo.replaceAll(seedActivityLogs());
}
