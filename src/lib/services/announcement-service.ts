import { announcementRepo } from "@/lib/data/repositories";
import type { Announcement, AnnouncementAudience, Teacher } from "@/lib/data/types";
import { logActivity, notify } from "./notification-service";

export type CreateAnnouncementInput = {
  title: string;
  content: string;
  audience?: AnnouncementAudience | undefined;
  pinned?: boolean | undefined;
};

export function listAnnouncements(
  announcements: Announcement[],
  userRole?: string | undefined,
): Announcement[] {
  return [...announcements]
    .filter((a) => {
      if (!userRole) return true;
      if (a.audience === "all") return true;
      if (a.audience === "teachers" && userRole === "teacher") return true;
      if (a.audience === "upgraders" && userRole === "upgrader") return true;
      return true;
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.createdAt.localeCompare(a.createdAt);
    });
}

export function createAnnouncement(
  input: CreateAnnouncementInput,
  author: Teacher,
): Announcement {
  const ann = announcementRepo.create({
    title: input.title,
    content: input.content,
    authorId: author.id,
    authorName: author.name,
    pinned: input.pinned ?? false,
    audience: input.audience ?? "all",
  });

  notify({
    title: `Pengumuman Baru: ${ann.title}`,
    body: ann.content.slice(0, 100) + (ann.content.length > 100 ? "..." : ""),
    level: "info",
    type: "ANNOUNCEMENT_CREATED",
    announcementId: ann.id,
  });

  logActivity({
    action: "ANNOUNCEMENT_CREATED",
    description: `Pengumuman "${ann.title}" diterbitkan oleh ${author.name}.`,
    actorId: author.id,
    actorName: author.name,
    entity: "announcements",
    entityId: ann.id,
  });

  return ann;
}

export function updateAnnouncement(
  id: string,
  input: Partial<CreateAnnouncementInput>,
  authorId?: string | undefined,
): Announcement | undefined {
  const updated = announcementRepo.update(id, {
    ...(input.title ? { title: input.title } : {}),
    ...(input.content ? { content: input.content } : {}),
    ...(input.audience ? { audience: input.audience } : {}),
    ...(input.pinned !== undefined ? { pinned: input.pinned } : {}),
  });

  if (updated) {
    logActivity({
      action: "ANNOUNCEMENT_UPDATED",
      description: `Pengumuman "${updated.title}" diperbarui.`,
      ...(authorId ? { actorId: authorId } : {}),
      entity: "announcements",
      entityId: updated.id,
    });
  }

  return updated;
}

export function togglePinAnnouncement(id: string): Announcement | undefined {
  const existing = announcementRepo.get(id);
  if (!existing) return undefined;
  return announcementRepo.update(id, { pinned: !existing.pinned });
}

export function deleteAnnouncement(id: string, authorId?: string | undefined): void {
  const ann = announcementRepo.get(id);
  if (!ann) return;

  announcementRepo.remove(id);

  logActivity({
    action: "ANNOUNCEMENT_DELETED",
    description: `Pengumuman "${ann.title}" dihapus.`,
    ...(authorId ? { actorId: authorId } : {}),
    entity: "announcements",
    entityId: id,
  });
}
