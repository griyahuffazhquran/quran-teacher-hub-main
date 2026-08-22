import { reminderRepo, targetRepo } from "@/lib/data/repositories";
import type { Reminder, ReminderFrequency } from "@/lib/data/types";
import { pushMutationToGas } from "./gas-api-service";
import { logActivity, notify } from "./notification-service";

export type CreateReminderInput = {
  targetId: string;
  teacherId: string;
  title: string;
  message: string;
  frequency?: ReminderFrequency | undefined;
  remindAt: string; // ISO date
};

export function listReminders(reminders: Reminder[]): Reminder[] {
  return [...reminders].sort((a, b) => (a.remindAt || "").localeCompare(b.remindAt || ""));
}

export function remindersForTeacher(reminders: Reminder[], teacherId?: string): Reminder[] {
  return listReminders(reminders).filter(
    (r) => !teacherId || r.teacherId === teacherId,
  );
}

export function remindersForTarget(reminders: Reminder[], targetId: string): Reminder[] {
  return listReminders(reminders).filter((r) => r.targetId === targetId);
}

export function createReminder(input: CreateReminderInput, creatorId?: string): Reminder {
  const target = targetRepo.get(input.targetId);
  const targetTitle = target?.title ?? "Target";

  const reminder = reminderRepo.create({
    targetId: input.targetId,
    teacherId: input.teacherId,
    title: input.title,
    message: input.message,
    frequency: input.frequency ?? "once",
    remindAt: input.remindAt,
    dismissed: false,
  });

  pushMutationToGas("reminders", "create", reminder);

  notify({
    title: `Pengingat Dijadwalkan: ${input.title}`,
    body: `Pengingat untuk target "${targetTitle}" telah diatur pada ${new Date(input.remindAt).toLocaleDateString("id-ID")}.`,
    level: "info",
    type: "REMINDER_TRIGGERED",
    userId: input.teacherId,
    targetId: input.targetId,
    reminderId: reminder.id,
  });

  logActivity({
    action: "REMINDER_CREATED",
    description: `Pengingat "${reminder.title}" dibuat untuk target "${targetTitle}".`,
    ...(creatorId ? { actorId: creatorId } : {}),
    entity: "reminders",
    entityId: reminder.id,
  });

  return reminder;
}

export function dismissReminder(id: string): Reminder | undefined {
  const reminder = reminderRepo.get(id);
  if (!reminder) return undefined;

  const updated = reminderRepo.update(id, { dismissed: !reminder.dismissed });
  if (updated) {
    pushMutationToGas("reminders", "update", updated);
  }
  return updated;
}

export function deleteReminder(id: string): void {
  const reminder = reminderRepo.get(id);
  if (reminder) {
    reminderRepo.remove(id);
    pushMutationToGas("reminders", "delete", { id });
  }
}
