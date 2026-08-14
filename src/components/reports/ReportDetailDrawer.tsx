import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Pencil,
  Trash2,
  User,
  UserCheck,
  BookOpen,
  FileText,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatDate, materialLabel, statusLabel, teacherName } from "@/lib/data/selectors";
import type { Report, Teacher } from "@/lib/data/types";

const gradeTone: Record<Report["grade"], "default" | "secondary" | "destructive"> = {
  A: "default",
  B: "secondary",
  C: "secondary",
  D: "destructive",
};

const statusTone: Record<Report["status"], "default" | "outline" | "secondary"> = {
  selesai: "default",
  pr_aktif: "secondary",
  perlu_perbaikan: "outline",
};

interface ReportDetailDrawerProps {
  report: Report | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teachers: Teacher[];
  canEdit: boolean;
  currentUserId?: string | undefined;
  onEdit?: ((report: Report) => void) | undefined;
  onDelete?: ((report: Report) => void) | undefined;
  onToggleHomework?: ((report: Report) => void) | undefined;
}

export function ReportDetailDrawer({
  report,
  open,
  onOpenChange,
  teachers,
  canEdit,
  currentUserId,
  onEdit,
  onDelete,
  onToggleHomework,
}: ReportDetailDrawerProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (!report) return null;

  const assessedName = teacherName(teachers, report.teacherId);
  const isHomeworkToggleable =
    report.homework && (canEdit || report.teacherId === currentUserId);

  const handleDelete = () => {
    onDelete?.(report);
    setDeleteDialogOpen(false);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto flex flex-col justify-between">
        <div className="space-y-6 pt-2">
          {/* Header */}
          <SheetHeader className="text-left space-y-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant="secondary" className="font-semibold">
                {materialLabel[report.material]}
              </Badge>
              <Badge variant={gradeTone[report.grade]} className="font-bold text-sm px-2.5">
                Nilai {report.grade}
              </Badge>
              <Badge variant={statusTone[report.status]} className="text-xs">
                {statusLabel[report.status]}
              </Badge>
            </div>
            <SheetTitle className="text-xl font-bold text-foreground">
              Detail Setoran Guru
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground flex items-center gap-1.5 pt-0.5">
              <Calendar className="size-3.5 text-muted-foreground" />
              <span>Tanggal Setoran: {formatDate(report.date)}</span>
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 text-sm">
            {/* Parties */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl border border-border bg-muted/40">
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <User className="size-3 text-primary" /> Guru Yang Dinilai
                </span>
                <p className="font-semibold text-foreground text-sm truncate">{assessedName}</p>
              </div>
              <div className="space-y-1 border-l border-border pl-3">
                <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <UserCheck className="size-3 text-emerald-500" /> Mustami' (Penyimak)
                </span>
                <p className="font-semibold text-foreground text-sm truncate">{report.mustamiName}</p>
              </div>
            </div>

            {/* Material Details */}
            <div className="p-3.5 rounded-xl border border-border space-y-2 bg-card">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <BookOpen className="size-3.5 text-primary" /> Rincian Materi
              </div>
              <div>
                <p className="font-semibold text-foreground">{report.materialDetail}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{report.reference}</p>
              </div>
            </div>

            {/* Mustami Note */}
            <div className="p-3.5 rounded-xl border border-border space-y-2 bg-card">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <FileText className="size-3.5 text-amber-500" /> Catatan Mustami'
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                {report.mustamiNote || <span className="italic text-muted-foreground">Tidak ada catatan mustami'.</span>}
              </p>
            </div>

            {/* Homework Section */}
            <div className="p-3.5 rounded-xl border border-border space-y-2.5 bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <AlertCircle className="size-3.5 text-orange-500" /> Catatan PR / Tugas
                </div>
                {report.homework && (
                  <Badge variant={report.homeworkDone ? "default" : "outline"} className="text-[10px]">
                    {report.homeworkDone ? "PR Selesai" : "PR Belum Selesai"}
                  </Badge>
                )}
              </div>

              {report.homework ? (
                <div className="space-y-3">
                  <p className="text-sm text-foreground/90 leading-relaxed bg-muted/50 p-2.5 rounded-lg border border-border/50">
                    {report.homework}
                  </p>
                  {isHomeworkToggleable && onToggleHomework && (
                    <Button
                      size="sm"
                      variant={report.homeworkDone ? "outline" : "secondary"}
                      onClick={() => onToggleHomework(report)}
                      className="w-full h-9 text-xs font-medium gap-2"
                    >
                      {report.homeworkDone ? (
                        <>
                          <CheckCircle2 className="size-4 text-emerald-500" /> Tandai Belum Selesai
                        </>
                      ) : (
                        <>
                          <Clock className="size-4 text-amber-500" /> Tandai PR Sudah Selesai
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Tidak ada catatan PR untuk setoran ini.</p>
              )}
            </div>

            {/* Metadata timestamps */}
            <div className="text-[11px] text-muted-foreground space-y-0.5 pt-2 border-t border-border">
              <p>Dibuat: {new Date(report.createdAt).toLocaleString("id-ID")}</p>
              <p>Terakhir diperbarui: {new Date(report.updatedAt).toLocaleString("id-ID")}</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        {canEdit && (
          <div className="flex items-center gap-2 pt-6 border-t border-border mt-6">
            <Button
              variant="outline"
              className="flex-1 text-xs gap-1.5"
              onClick={() => {
                onOpenChange(false);
                onEdit?.(report);
              }}
            >
              <Pencil className="size-3.5" /> Edit Setoran
            </Button>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="default" className="text-xs gap-1.5">
                  <Trash2 className="size-3.5" /> Hapus
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus Setoran Ini?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Setoran materi <strong>{report.materialDetail}</strong> ({report.reference}) untuk{" "}
                    <strong>{assessedName}</strong> akan dihapus (soft delete) dari sistem.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Ya, Hapus
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
