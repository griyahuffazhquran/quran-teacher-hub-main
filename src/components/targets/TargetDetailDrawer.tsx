import { useState } from "react";
import {
  Bell,
  BellPlus,
  Calendar,
  CheckCircle2,
  Clock,
  Pencil,
  Plus,
  Target as TargetIcon,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useCollection } from "@/hooks/use-repository";
import { reminderRepo } from "@/lib/data/repositories";
import { formatDate, targetProgress, teacherName } from "@/lib/data/selectors";
import type { ReminderFrequency, Target, Teacher } from "@/lib/data/types";
import { createReminder, deleteReminder, dismissReminder } from "@/lib/services/reminder-service";
import { updateTargetProgress } from "@/lib/services/target-service";

import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

interface TargetDetailDrawerProps {
  target: Target | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teachers: Teacher[];
  canEdit: boolean;
  currentUserId?: string | undefined;
  onEdit?: ((target: Target) => void) | undefined;
  onDelete?: ((target: Target, mode: "permanent" | "soft") => void) | undefined;
}

export function TargetDetailDrawer({
  target,
  open,
  onOpenChange,
  teachers,
  canEdit,
  currentUserId,
  onEdit,
  onDelete,
}: TargetDetailDrawerProps) {
  const { rows: allReminders } = useCollection(reminderRepo);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Form state for creating a new reminder
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [remTitle, setRemTitle] = useState("");
  const [remMessage, setRemMessage] = useState("");
  const [remFreq, setRemFreq] = useState<ReminderFrequency>("weekly");
  const [remDate, setRemDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  });

  // State for updating target progress live
  const [progressInput, setProgressInput] = useState<string>("");

  if (!target) return null;

  const pct = targetProgress(target);
  const tName = teacherName(teachers, target.teacherId);
  const targetReminders = allReminders.filter((r) => r.targetId === target.id);

  const handleSaveProgress = () => {
    const val = Number(progressInput);
    if (isNaN(val) || val < 0) {
      toast.error("Masukkan nilai progres yang valid.");
      return;
    }
    updateTargetProgress(target.id, val, currentUserId);
    toast.success("Progres target diperbarui!");
    setProgressInput("");
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remTitle.trim()) {
      toast.error("Judul pengingat harus diisi.");
      return;
    }

    createReminder(
      {
        targetId: target.id,
        teacherId: target.teacherId,
        title: remTitle.trim(),
        message: remMessage.trim() || `Pengingat untuk target "${target.title}"`,
        frequency: remFreq,
        remindAt: remDate,
      },
      currentUserId,
    );

    toast.success("Pengingat berhasil dibuat!");
    setRemTitle("");
    setRemMessage("");
    setShowReminderForm(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto flex flex-col justify-between p-6">
        <div className="space-y-5 pt-2">
          {/* Header */}
          <SheetHeader className="text-left space-y-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge
                variant={
                  target.status === "tercapai"
                    ? "default"
                    : target.status === "gagal"
                      ? "destructive"
                      : "secondary"
                }
                className="font-semibold capitalize"
              >
                {target.status}
              </Badge>
              <Badge variant="outline" className="capitalize">
                Periode {target.period}
              </Badge>
            </div>
            <SheetTitle className="text-xl font-bold text-foreground">
              {target.title}
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground flex items-center gap-1.5 pt-0.5">
              <User className="size-3.5 text-primary" />
              <span>Pengajar: {tName}</span>
            </SheetDescription>
          </SheetHeader>

          {/* Description */}
          {target.description && (
            <div className="p-3 rounded-xl border border-border bg-muted/40 text-xs leading-relaxed text-muted-foreground">
              {target.description}
            </div>
          )}

          {/* Progress Overview Card */}
          <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <TargetIcon className="size-4 text-primary" /> Progres Pencapaian
                </span>
                <span className="text-sm font-bold text-primary">{pct}%</span>
              </div>

              <Progress value={pct} className="h-3 rounded-full" />

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span>Tercapai: <strong className="text-foreground">{target.currentValue} {target.unit}</strong></span>
                <span>Target: <strong className="text-foreground">{target.targetValue} {target.unit}</strong></span>
              </div>

              {/* Update progress input */}
              {canEdit && target.status === "aktif" && (
                <div className="pt-2 border-t border-border/50 flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    placeholder={`Update nilai (${target.unit})...`}
                    value={progressInput}
                    onChange={(e) => setProgressInput(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveProgress}
                    className="h-8 text-xs font-medium shrink-0"
                  >
                    Simpan Progres
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dates Info */}
          <div className="grid grid-cols-2 gap-3 text-xs p-3.5 rounded-xl border border-border bg-card">
            <div>
              <span className="text-muted-foreground flex items-center gap-1 mb-0.5">
                <Calendar className="size-3 text-muted-foreground" /> Tanggal Mulai
              </span>
              <p className="font-semibold text-foreground">{formatDate(target.startDate)}</p>
            </div>
            <div className="border-l border-border pl-3">
              <span className="text-muted-foreground flex items-center gap-1 mb-0.5">
                <Clock className="size-3 text-amber-500" /> Tenggat (Due Date)
              </span>
              <p className="font-semibold text-foreground">{formatDate(target.dueDate)}</p>
            </div>
          </div>

          {/* Integrated Reminders Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Bell className="size-3.5 text-amber-500" /> Pengingat & Reminder ({targetReminders.length})
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReminderForm(!showReminderForm)}
                className="h-7 text-xs font-medium gap-1"
              >
                <BellPlus className="size-3" /> {showReminderForm ? "Batal" : "Tambah Reminder"}
              </Button>
            </div>

            {/* Reminder Form */}
            {showReminderForm && (
              <form onSubmit={handleAddReminder} className="p-3.5 rounded-xl border border-primary/30 bg-card space-y-3 animate-fade-down">
                <h5 className="text-xs font-bold text-foreground">Buat Pengingat Baru</h5>
                <div className="space-y-1">
                  <Label className="text-[11px]">Judul Pengingat</Label>
                  <Input
                    placeholder="Contoh: Pengingat Setoran Ziyadah H-3"
                    value={remTitle}
                    onChange={(e) => setRemTitle(e.target.value)}
                    className="h-8 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Pesan Notifikasi</Label>
                  <Textarea
                    placeholder="Tuliskan pesan pengingat..."
                    value={remMessage}
                    onChange={(e) => setRemMessage(e.target.value)}
                    className="text-xs min-h-[50px] resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Frekuensi</Label>
                    <Select value={remFreq} onValueChange={(v) => setRemFreq(v as ReminderFrequency)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="once">Sekali</SelectItem>
                        <SelectItem value="daily">Harian</SelectItem>
                        <SelectItem value="weekly">Mingguan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Tanggal Diingatkan</Label>
                    <Input
                      type="date"
                      value={remDate}
                      onChange={(e) => setRemDate(e.target.value)}
                      className="h-8 text-xs"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" size="sm" className="w-full h-8 text-xs font-medium mt-1">
                  Simpan Pengingat
                </Button>
              </form>
            )}

            {/* Reminders List */}
            {targetReminders.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-2">
                Belum ada pengingat khusus untuk target ini.
              </p>
            ) : (
              <div className="space-y-2">
                {targetReminders.map((r) => (
                  <div
                    key={r.id}
                    className={`p-3 rounded-xl border flex items-start justify-between gap-2 transition-all ${
                      r.dismissed ? "bg-muted/40 border-border opacity-70" : "bg-card border-border shadow-2xs"
                    }`}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-xs text-foreground">{r.title}</p>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 capitalize">
                          {r.frequency}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-snug">{r.message}</p>
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                        Diingatkan: {formatDate(r.remindAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!r.dismissed ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 text-muted-foreground hover:text-emerald-500"
                          onClick={() => {
                            dismissReminder(r.id);
                            toast.success("Pengingat ditandai selesai.");
                          }}
                          title="Tandai selesai"
                        >
                          <CheckCircle2 className="size-3.5" />
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="text-[9px]">
                          Selesai
                        </Badge>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          deleteReminder(r.id);
                          toast.success("Pengingat dihapus.");
                        }}
                        title="Hapus pengingat"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        {canEdit && (
          <div className="flex items-center gap-2 pt-4 border-t border-border mt-6">
            <Button
              variant="outline"
              className="flex-1 text-xs gap-1.5"
              onClick={() => {
                onOpenChange(false);
                onEdit?.(target);
              }}
            >
              <Pencil className="size-3.5" /> Edit Target
            </Button>
            <Button
              variant="destructive"
              className="text-xs gap-1.5"
              onClick={() => setDeleteConfirmOpen(true)}
            >
              <Trash2 className="size-3.5" /> Hapus
            </Button>

            <ConfirmDeleteDialog
              open={deleteConfirmOpen}
              onOpenChange={setDeleteConfirmOpen}
              title="Hapus Target Upgrading"
              itemName={target.title}
              onConfirm={(mode) => {
                onOpenChange(false);
                onDelete?.(target, mode);
              }}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
