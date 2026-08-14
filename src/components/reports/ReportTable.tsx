import { Pencil, Trash2, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, materialLabel, statusLabel } from "@/lib/data/selectors";
import type { Report, Teacher } from "@/lib/data/types";

const gradeTone: Record<Report["grade"], "default" | "secondary" | "destructive"> = {
  A: "default",
  B: "secondary",
  C: "secondary",
  D: "destructive",
};

export function ReportTable({
  reports,
  teachers,
  canEdit,
  currentUserId,
  onEdit,
  onDelete,
  onToggleHomework,
}: {
  reports: Report[];
  teachers: Teacher[];
  canEdit: boolean;
  currentUserId?: string | undefined;
  onEdit?: ((r: Report) => void) | undefined;
  onDelete?: ((r: Report) => void) | undefined;
  onToggleHomework?: ((r: Report) => void) | undefined;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm animate-zoom-in">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[120px] font-bold">Tanggal</TableHead>
            <TableHead className="font-bold">Guru</TableHead>
            <TableHead className="font-bold">Mustami'</TableHead>
            <TableHead className="font-bold">Materi & Ayat</TableHead>
            <TableHead className="w-[110px] text-center font-bold">Nilai</TableHead>
            <TableHead className="font-bold">Catatan</TableHead>
            <TableHead className="font-bold">PR / Tugas</TableHead>
            {canEdit && <TableHead className="w-[90px] text-right font-bold">Aksi</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => {
            const assessedTeacher =
              teachers.find((t) => t.id === report.teacherId)?.name ?? "—";
            const isHomeworkToggleable =
              report.homework && (canEdit || report.teacherId === currentUserId);

            return (
              <TableRow
                key={report.id}
                className="transition-colors hover:bg-accent/30 group"
              >
                <TableCell className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                  {formatDate(report.date)}
                </TableCell>
                <TableCell className="font-medium text-sm text-foreground">
                  {assessedTeacher}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {report.mustamiName}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {materialLabel[report.material]}
                      </Badge>
                      <span className="font-medium text-xs text-foreground">
                        {report.materialDetail}
                      </span>
                    </div>
                    {report.reference && (
                      <span className="text-[11px] text-muted-foreground">
                        {report.reference}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <Badge variant={gradeTone[report.grade]} className="text-xs px-2">
                      {report.grade}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {statusLabel[report.status]}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
                  {report.mustamiNote || "—"}
                </TableCell>
                <TableCell>
                  {report.homework ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {report.homework}
                      </span>
                      {isHomeworkToggleable && onToggleHomework ? (
                        <Button
                          size="sm"
                          variant={report.homeworkDone ? "outline" : "secondary"}
                          onClick={() => onToggleHomework(report)}
                          className="h-6 px-2 text-[10px] font-medium"
                        >
                          {report.homeworkDone ? (
                            <>
                              <CheckCircle2 className="mr-1 size-3 text-emerald-500" /> Selesai
                            </>
                          ) : (
                            <>
                              <Clock className="mr-1 size-3 text-amber-500" /> Tandai
                            </>
                          )}
                        </Button>
                      ) : (
                        <Badge
                          variant={report.homeworkDone ? "default" : "outline"}
                          className="text-[10px]"
                        >
                          {report.homeworkDone ? "Selesai" : "Belum"}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground/50">—</span>
                  )}
                </TableCell>
                {canEdit && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-muted-foreground hover:text-foreground"
                        onClick={() => onEdit?.(report)}
                        title="Edit setoran"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-muted-foreground hover:text-destructive"
                        onClick={() => onDelete?.(report)}
                        title="Hapus setoran"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
