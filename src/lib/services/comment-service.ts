import { commentRepo, reportRepo } from "@/lib/data/repositories";
import type { ReportComment, Teacher } from "@/lib/data/types";
import { logActivity, notify } from "./notification-service";

export function createComment(input: {
  reportId: string;
  author: Teacher;
  content: string;
}): ReportComment | { error: string } {
  const content = input.content.trim();
  if (!content) return { error: "Komentar tidak boleh kosong." };
  if (content.length > 500) return { error: "Komentar maksimal 500 karakter." };

  const report = reportRepo.get(input.reportId);
  if (!report) return { error: "Setoran tidak ditemukan." };

  const comment = commentRepo.create({
    reportId: input.reportId,
    authorId: input.author.id,
    authorName: input.author.name,
    authorRole: input.author.role ?? "teacher",
    content,
  });

  // Notify parties involved in the report (teacher and mustami) if author is not them
  const recipients = new Set<string>();
  if (report.teacherId !== input.author.id) recipients.add(report.teacherId);
  if (report.mustamiId !== input.author.id) recipients.add(report.mustamiId);

  for (const userId of recipients) {
    notify({
      title: "Komentar Baru di Setoran",
      body: `${input.author.name}: "${content.slice(0, 60)}${content.length > 60 ? "..." : ""}"`,
      level: "info",
      type: "COMMENT_CREATED",
      userId,
      reportId: report.id,
      commentId: comment.id,
    });
  }

  logActivity({
    action: "COMMENT_CREATED",
    description: `${input.author.name} mengomentari setoran ${report.reference}.`,
    actorId: input.author.id,
    actorName: input.author.name,
    entity: "comments",
    entityId: comment.id,
  });

  return comment;
}

export function listCommentsForReport(comments: ReportComment[], reportId: string): ReportComment[] {
  return comments
    .filter((c) => c.reportId === reportId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function deleteComment(id: string, actor: Teacher): boolean {
  const existing = commentRepo.get(id);
  if (!existing) return false;
  if (existing.authorId !== actor.id && actor.role !== "upgrader") {
    return false;
  }
  commentRepo.remove(id);
  logActivity({
    action: "COMMENT_DELETED",
    description: `${actor.name} menghapus komentar.`,
    actorId: actor.id,
    actorName: actor.name,
    entity: "comments",
    entityId: id,
  });
  return true;
}
