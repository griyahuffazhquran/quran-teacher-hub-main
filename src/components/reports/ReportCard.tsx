import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, materialLabel, statusLabel } from "@/lib/data/selectors";
import type { Report, Teacher } from "@/lib/data/types";

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
  onEdit,
  onDelete,
  onToggleHomework,
}: {
  report: Report;
  teachers: Teacher[];
  canEdit: boolean;
  onEdit?: (r: Report) => void;
  onDelete?: (r: Report) => void;
  onToggleHomework?: (r: Report) => void;
}) {
  const assessed = teachers.find((t) => t.id === report.teacherId)?.name ?? "—";

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium">{assessed}</p>
            <p className="text-xs text-muted-foreground">{formatDate(report.date)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Badge variant="secondary">{materialLabel[report.material]}</Badge>
            <Badge variant={gradeTone[report.grade]}>{report.grade}</Badge>
          </div>
        </div>

        <div className="text-sm">
          <p className="font-medium">{report.materialDetail}</p>
          <p className="text-muted-foreground">{report.reference}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Mustami': {report.mustamiName}</span>
          <Badge variant="outline">{statusLabel[report.status]}</Badge>
        </div>

        {report.mustamiNote && (
          <p className="text-xs text-muted-foreground">Catatan: {report.mustamiNote}</p>
        )}

        {report.homework && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/60 p-2 text-xs">
            <span className="min-w-0">PR: {report.homework}</span>
            {onToggleHomework ? (
              <Button size="sm" variant="ghost" onClick={() => onToggleHomework(report)}>
                {report.homeworkDone ? "Selesai" : "Tandai selesai"}
              </Button>
            ) : (
              <Badge variant={report.homeworkDone ? "default" : "secondary"}>
                {report.homeworkDone ? "Selesai" : "Belum"}
              </Badge>
            )}
          </div>
        )}

        {canEdit && (
          <div className="flex justify-end gap-1">
            <Button size="sm" variant="ghost" onClick={() => onEdit?.(report)}>
              <Pencil className="mr-1 size-3.5" /> Edit
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDelete?.(report)}>
              <Trash2 className="mr-1 size-3.5" /> Hapus
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
