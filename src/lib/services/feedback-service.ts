import { feedbackRepo, reportRepo } from "@/lib/data/repositories";
import type { Feedback, FeedbackType, Teacher } from "@/lib/data/types";
import { logActivity, notify } from "./notification-service";

export function createFeedback(input: {
  reportId: string;
  author: Teacher;
  content: string;
}): Feedback | { error: string } {
  const content = input.content.trim();
  if (!content) return { error: "Isi feedback tidak boleh kosong." };
  if (content.length > 500) return { error: "Feedback maksimal 500 karakter." };

  const report = reportRepo.get(input.reportId);
  if (!report) return { error: "Setoran tidak ditemukan." };

  const isUpgrader = input.author.role === "upgrader";
  const type: FeedbackType = isUpgrader ? "upgrader" : "mustami";

  const feedback = feedbackRepo.create({
    reportId: input.reportId,
    authorId: input.author.id,
    authorName: input.author.name,
    authorRole: input.author.role ?? "teacher",
    type,
    content,
  });

  // Notify the teacher being assessed
  if (report.teacherId !== input.author.id) {
    notify({
      title: isUpgrader ? "Feedback dari Upgrader" : "Feedback dari Mustami'",
      body: `${input.author.name} memberikan feedback pada setoran ${report.materialDetail} (${report.reference}).`,
      level: isUpgrader ? "info" : "success",
      type: "FEEDBACK_CREATED",
      userId: report.teacherId,
      reportId: report.id,
      feedbackId: feedback.id,
    });
  }

  logActivity({
    action: "FEEDBACK_CREATED",
    description: `${input.author.name} memberikan feedback untuk setoran ${report.reference}.`,
    actorId: input.author.id,
    actorName: input.author.name,
    entity: "feedbacks",
    entityId: feedback.id,
  });

  return feedback;
}

export function listFeedbacksForReport(feedbacks: Feedback[], reportId: string): Feedback[] {
  return feedbacks
    .filter((f) => f.reportId === reportId)
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

export function deleteFeedback(id: string, actor: Teacher): boolean {
  const existing = feedbackRepo.get(id);
  if (!existing) return false;
  // Allow author or upgrader to delete feedback
  if (existing.authorId !== actor.id && actor.role !== "upgrader") {
    return false;
  }
  feedbackRepo.remove(id);
  logActivity({
    action: "FEEDBACK_DELETED",
    description: `${actor.name} menghapus feedback.`,
    actorId: actor.id,
    actorName: actor.name,
    entity: "feedbacks",
    entityId: id,
  });
  return true;
}
