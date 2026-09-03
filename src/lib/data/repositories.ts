import { migrateReports } from "./migrations";
import { createRepository } from "./repository";
import {
  seedAchievements,
  seedActivityLogs,
  seedAnnouncements,
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
  Announcement,
  Feedback,
  NotificationItem,
  Reminder,
  Report,
  ReportComment,
  Target,
  Teacher,
} from "./types";

const EMPTY_INIT = () => [];

export const teacherRepo = createRepository<Teacher>("teachers", EMPTY_INIT);
export const reportRepo = createRepository<Report>("reports", EMPTY_INIT, migrateReports);
export const targetRepo = createRepository<Target>("targets", EMPTY_INIT);
export const reminderRepo = createRepository<Reminder>("reminders", EMPTY_INIT);
export const achievementRepo = createRepository<Achievement>("achievements", EMPTY_INIT);
export const announcementRepo = createRepository<Announcement>("announcements", EMPTY_INIT);
export const feedbackRepo = createRepository<Feedback>("feedbacks", EMPTY_INIT);
export const commentRepo = createRepository<ReportComment>("comments", EMPTY_INIT);
export const notificationRepo = createRepository<NotificationItem>("notifications", EMPTY_INIT);
export const activityRepo = createRepository<ActivityLog>("activityLogs", EMPTY_INIT);

export const allRepos = [
  teacherRepo,
  reportRepo,
  targetRepo,
  reminderRepo,
  achievementRepo,
  announcementRepo,
  feedbackRepo,
  commentRepo,
  notificationRepo,
  activityRepo,
] as const;

export function hydrateAll() {
  for (const repo of allRepos) repo.hydrate();
}

export function resetDemoData() {
  resetAllData(allRepos.map((r) => r.name));
  for (const repo of allRepos) repo.replaceAll([]);
}
