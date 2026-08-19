import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Megaphone,
  Plus,
  Pin,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { AnnouncementDialog } from "@/components/announcements/AnnouncementDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { useCollection } from "@/hooks/use-repository";
import { useSession } from "@/hooks/use-session";
import { announcementRepo } from "@/lib/data/repositories";
import { formatDate } from "@/lib/data/selectors";
import type { Announcement } from "@/lib/data/types";
import {
  deleteAnnouncement,
  listAnnouncements,
  togglePinAnnouncement,
} from "@/lib/services/announcement-service";

export const Route = createFileRoute("/announcements")({
  head: () => ({
    meta: [
      { title: "Pengumuman Lembaga | Griya Huffazh Quran" },
      {
        name: "description",
        content: "Media pengumuman resmi dan informasi penting upgrading pengajar Griya Huffazh Quran.",
      },
    ],
  }),
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  const { user, role, isUpgrader } = useSession();
  const { rows: announcements } = useCollection(announcementRepo);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState<Announcement | undefined>(undefined);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const list = useMemo(
    () => listAnnouncements(announcements, role),
    [announcements, role],
  );

  const handleCreate = () => {
    setEditingAnn(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (ann: Announcement) => {
    setEditingAnn(ann);
    setDialogOpen(true);
  };

  const handleTogglePin = (id: string) => {
    togglePinAnnouncement(id);
    toast.success("Status sematan pengumuman diperbarui.");
  };

  const handleDeleteConfirm = () => {
    if (!deleteId) return;
    deleteAnnouncement(deleteId, user?.id);
    toast.success("Pengumuman berhasil dihapus.");
    setDeleteId(null);
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Pengumuman Lembaga"
          description="Pusat informasi resmi dan instruksi penting dari pengurus & upgrader Griya Huffazh Quran."
          action={
            isUpgrader ? (
              <Button onClick={handleCreate} className="gap-2 shadow-xs">
                <Plus className="size-4" />
                <span>Pengumuman Baru</span>
              </Button>
            ) : undefined
          }
        />

        {list.length === 0 ? (
          <Card className="border-dashed py-12 text-center">
            <CardContent className="flex flex-col items-center justify-center space-y-3">
              <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                <Megaphone className="size-6" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold">Belum Ada Pengumuman</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Pengumuman penting terkait upgrading, jadwal setoran, dan instruksi lembaga akan tampil di sini.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {list.map((ann) => {
              const isPendingDeadline = ann.dueDate && ann.dueDate >= todayStr;
              return (
                <Card
                  key={ann.id}
                  className={`relative overflow-hidden transition-all duration-200 hover:shadow-md ${
                    ann.pinned
                      ? "border-primary/40 bg-primary/5 dark:bg-primary/10"
                      : "border-border bg-card"
                  }`}
                >
                  {/* Active Beep Red Pulse Dot if has upcoming deadline */}
                  {isPendingDeadline && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-destructive/10 text-destructive text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-destructive/20">
                      <span className="relative flex size-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
                        <span className="relative inline-flex size-2 rounded-full bg-destructive"></span>
                      </span>
                      <span>Berlangsung s/d {formatDate(ann.dueDate!)}</span>
                    </div>
                  )}

                  <CardHeader className="pb-2 pt-4 px-5">
                    <div className="flex flex-wrap items-center gap-2">
                      {ann.pinned && (
                        <Badge variant="default" className="gap-1 bg-primary text-primary-foreground text-[10px]">
                          <Pin className="size-3" /> Disematkan
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] uppercase font-bold">
                        {ann.audience === "all"
                          ? "Semua Pengajar"
                          : ann.audience === "teachers"
                          ? "Khusus Guru"
                          : "Khusus Upgrader"}
                      </Badge>
                    </div>

                    <CardTitle className="text-base font-bold tracking-tight mt-1 text-foreground">
                      {ann.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>Oleh: <strong>{ann.authorName}</strong></span>
                      <span>•</span>
                      <span>{formatDate(ann.createdAt)}</span>
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="px-5 pb-4 space-y-4">
                    <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/90">
                      {ann.content}
                    </p>

                    {isUpgrader && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePin(ann.id)}
                          className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <Pin className="size-3.5" />
                          <span>{ann.pinned ? "Lepas Sematan" : "Sematkan"}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(ann)}
                          className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="size-3.5" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(ann.id)}
                          className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3.5" />
                          <span>Hapus</span>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create/Edit Dialog */}
        {user && (
          <AnnouncementDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            currentUser={user}
            editing={editingAnn}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDeleteDialog
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
          title="Hapus Pengumuman"
          itemName={announcements.find((a) => a.id === deleteId)?.title}
          allowChoice={false}
          onConfirm={() => {
            if (!deleteId) return;
            announcementRepo.remove(deleteId);
            toast.success("Pengumuman berhasil dihapus dari database.");
            setDeleteId(null);
          }}
        />
      </div>
    </AppShell>
  );
}
