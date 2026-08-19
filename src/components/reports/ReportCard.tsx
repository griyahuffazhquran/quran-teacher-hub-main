import { Eye, MessageSquare, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, materialLabel, parseGrade, statusLabel } from "@/lib/data/selectors";
import type { Report, Teacher } from "@/lib/data/types";
import { getWhatsAppDirectUrl } from "@/lib/whatsapp";

const gradeTone: Record<Report["grade"], "default" | "secondary" | "destructive"> = {
  A: "default",
  B: "secondary",
  C: "secondary",
  D: "destructive",
};

export function ReportCard({
  report,
  teachers,
  canEdit,
  onSelect,
  onEdit,
  onDelete,
  onToggleHomework,
}: {
  report: Report;
  teachers: Teacher[];
  canEdit: boolean;
  onSelect?: (r: Report) => void;
  onEdit?: (r: Report) => void;
  onDelete?: (r: Report) => void;
  onToggleHomework?: (r: Report) => void;
}) {
  const assessed = teachers.find((t) => t.id === report.teacherId)?.name ?? "—";
  const safeGrade = parseGrade(report.grade);

  return (
    <Card className="transition-all hover:border-primary/40 hover:shadow-md cursor-pointer group">
      <CardContent className="space-y-3 p-4" onClick={() => onSelect?.(report)}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground group-hover:text-primary transition-colors">
              {assessed}
            </p>
            <p className="text-xs text-muted-foreground">{formatDate(report.date)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Badge variant="secondary" className="text-xs">
              {materialLabel[report.material]}
            </Badge>
            <Badge variant={gradeTone[safeGrade] ?? "secondary"} className="font-bold">
              {safeGrade}
            </Badge>
          </div>
        </div>

        <div className="text-sm">
          <p className="font-medium text-foreground">{report.materialDetail}</p>
          <p className="text-xs text-muted-foreground">{report.reference}</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>Mustami': <strong className="text-foreground/80 font-medium">{report.mustamiName}</strong></span>
          <Badge variant="outline" className="text-[10px]">
            {statusLabel[report.status]}
          </Badge>
        </div>

        {report.mustamiNote && (
          <p className="text-xs text-muted-foreground line-clamp-2 bg-muted/30 p-2 rounded border border-border/40">
            <span className="font-medium text-foreground/70">Catatan:</span> {report.mustamiNote}
          </p>
        )}

        {report.homework && (
          <div
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/60 p-2 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="min-w-0 font-medium text-foreground/90 truncate">PR: {report.homework}</span>
            {onToggleHomework ? (
              <Button size="sm" variant="ghost" onClick={() => onToggleHomework(report)} className="h-7 text-xs px-2">
                {report.homeworkDone ? "✓ Selesai" : "Tandai selesai"}
              </Button>
            ) : (
              <Badge variant={report.homeworkDone ? "default" : "secondary"} className="text-[10px]">
                {report.homeworkDone ? "Selesai" : "Belum"}
              </Badge>
            )}
          </div>
        )}

        <div
          className="flex items-center justify-between pt-2 border-t border-border/50 text-xs text-muted-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
            onClick={() => onSelect?.(report)}
          >
            <Eye className="size-3.5" /> Detail
          </Button>

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 gap-1 font-medium"
              onClick={() => {
                const targetTeacher = teachers.find((t) => t.id === report.teacherId);
                const phone = targetTeacher?.phone || "";
                if (!phone) {
                  toast.error(`Nomor WhatsApp untuk ${assessed} belum diisi.`);
                  return;
                }
                const url = getWhatsAppDirectUrl({
                  namaPeserta: assessed,
                  nomorWaPeserta: phone,
                  namaSurah: report.materialDetail || report.material,
                  ayatAwal: report.reference || "-",
                  ayatAkhir: "-",
                  nilai: report.grade,
                  catatan: report.mustamiNote || report.homework || "-",
                  namaPenguji: report.mustamiName,
                  tanggal: report.date,
                });
                toast.info(`Membuka WhatsApp untuk ${assessed}...`);
                window.open(url, "_blank");
              }}
            >
              <MessageSquare className="size-3.5" /> WA
            </Button>

            {canEdit && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                  onClick={() => onEdit?.(report)}
                >
                  <Pencil className="size-3.5" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive gap-1"
                  onClick={() => onDelete?.(report)}
                >
                  <Trash2 className="size-3.5" /> Hapus
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
