import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Announcement, AnnouncementAudience, Teacher } from "@/lib/data/types";
import { createAnnouncement, updateAnnouncement } from "@/lib/services/announcement-service";

interface AnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: Teacher;
  editing?: Announcement | undefined;
}

export function AnnouncementDialog({
  open,
  onOpenChange,
  currentUser,
  editing,
}: AnnouncementDialogProps) {
  const isEditing = !!editing;

  const [title, setTitle] = useState(editing?.title || "");
  const [content, setContent] = useState(editing?.content || "");
  const [audience, setAudience] = useState<AnnouncementAudience>(editing?.audience || "all");
  const [pinned, setPinned] = useState(editing?.pinned || false);

  useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setContent(editing.content);
      setAudience(editing.audience);
      setPinned(editing.pinned);
    } else {
      setTitle("");
      setContent("");
      setAudience("all");
      setPinned(false);
    }
  }, [editing, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error("Judul dan isi pengumuman harus diisi.");
      return;
    }

    if (isEditing && editing) {
      updateAnnouncement(
        editing.id,
        {
          title: title.trim(),
          content: content.trim(),
          audience,
          pinned,
        },
        currentUser.id,
      );
      toast.success("Pengumuman berhasil diperbarui.");
    } else {
      createAnnouncement(
        {
          title: title.trim(),
          content: content.trim(),
          audience,
          pinned,
        },
        currentUser,
      );
      toast.success("Pengumuman baru berhasil diterbitkan!");
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Megaphone className="size-5 text-primary" />
              {isEditing ? "Edit Pengumuman Lembaga" : "Terbitkan Pengumuman Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Kirimkan pengumuman resmi dari Koordinator Upgrading kepada pengajar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Judul Pengumuman</Label>
              <Input
                placeholder="Contoh: Jadwal Ujian Evaluasi Mutqin Semester"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Isi Pengumuman</Label>
              <Textarea
                placeholder="Tuliskan isi pengumuman secara lengkap..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="text-xs min-h-[100px] resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Target Penerima</Label>
                <Select value={audience} onValueChange={(v) => setAudience(v as AnnouncementAudience)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua (Guru & Upgrader)</SelectItem>
                    <SelectItem value="teachers">Pengajar / Guru Sahaja</SelectItem>
                    <SelectItem value="upgraders">Tim Upgrader Sahaja</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end pb-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="pinned-checkbox"
                    checked={pinned}
                    onCheckedChange={(c) => setPinned(!!c)}
                  />
                  <Label htmlFor="pinned-checkbox" className="text-xs font-semibold cursor-pointer">
                    Sematkan di Atas (Pin)
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs h-9"
            >
              Batal
            </Button>
            <Button type="submit" className="text-xs h-9 font-medium">
              {isEditing ? "Simpan Perubahan" : "Terbitkan Pengumuman"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
