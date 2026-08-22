import {
  BellPlus,
  Calendar,
  CheckCircle2,
  Clock,
  Minus,
  MoreVertical,
  Pencil,
  Plus,
  Target as TargetIcon,
  Trash2,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { formatDate, targetProgress, teacherName } from "@/lib/data/selectors";
import type { Target, Teacher } from "@/lib/data/types";
import { updateTargetProgress } from "@/lib/services/target-service";

interface TargetCardProps {
  target: Target;
  teachers: Teacher[];
  canEdit: boolean;
  onSelect: (target: Target) => void;
  onEdit: (target: Target) => void;
  onDelete: (target: Target) => void;
  onAddReminder: (target: Target) => void;
}

const statusBadgeConfig: Record<
  Target["status"],
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  aktif: { label: "Aktif", variant: "secondary" },
  tercapai: { label: "Tercapai 🎉", variant: "default" },
  gagal: { label: "Ketinggalan", variant: "destructive" },
};

export function TargetCard({
  target,
  teachers,
  canEdit,
  onSelect,
  onEdit,
  onDelete,
  onAddReminder,
}: TargetCardProps) {
  const pct = targetProgress(target);
  const tName = teacherName(teachers, target.teacherId);
  const statusInfo = statusBadgeConfig[target.status] || {
    label: target.status,
    variant: "outline" as const,
  };

  // Check if due date is within 5 days
  const dueDateObj = new Date(target.dueDate);
  const now = new Date();
  const diffDays = Math.ceil((dueDateObj.getTime() - now.getTime()) / (1000 * 3600 * 24));
  const isNearDeadline = target.status === "aktif" && diffDays >= 0 && diffDays <= 5;
  const isOverdue = target.status === "aktif" && diffDays < 0;

  const handleQuickAddProgress = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextVal = Math.min(target.targetValue, target.currentValue + 1);
    updateTargetProgress(target.id, nextVal);
  };

  const handleQuickSubtractProgress = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextVal = Math.max(0, target.currentValue - 1);
    updateTargetProgress(target.id, nextVal);
  };

  return (
    <Card
      className={`relative overflow-hidden transition-all hover:border-primary/50 hover:shadow-sm group cursor-pointer ${
        target.status === "tercapai"
          ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10"
          : isOverdue
            ? "border-destructive/30 bg-destructive/5"
            : "bg-card"
      }`}
      onClick={() => onSelect(target)}
    >
      <CardContent className="p-4 space-y-3.5">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant={statusInfo.variant} className="text-[10px] px-2 font-semibold">
                {statusInfo.label}
              </Badge>
              <Badge variant="outline" className="text-[10px] capitalize">
                {target.period}
              </Badge>
              {isNearDeadline && (
                <Badge variant="destructive" className="text-[10px] animate-pulse">
                  H-{diffDays} Tenggat
                </Badge>
              )}
            </div>

            <h3 className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {target.title}
            </h3>
          </div>

          {/* Action Menu */}
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7 text-muted-foreground">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 text-xs">
                <DropdownMenuItem onClick={() => onSelect(target)}>
                  <TargetIcon className="mr-2 size-3.5" /> Detail & Reminders
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddReminder(target)}>
                  <BellPlus className="mr-2 size-3.5 text-amber-500" /> Tambah Reminder
                </DropdownMenuItem>
                {canEdit && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEdit(target)}>
                      <Pencil className="mr-2 size-3.5" /> Edit Target
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(target)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 size-3.5" /> Hapus Target
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Teacher Assigned */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <User className="size-3.5 text-primary shrink-0" />
          <span className="truncate font-medium text-foreground">{tName}</span>
        </div>

        {/* Progress Bar & Value */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Capaian</span>
            <span className="font-bold text-foreground">
              {target.currentValue} / {target.targetValue} {target.unit} ({pct}%)
            </span>
          </div>
          <Progress
            value={pct}
            className={`h-2.5 rounded-full ${
              target.status === "tercapai" ? "[&>div]:bg-emerald-500" : ""
            }`}
          />
        </div>

        {/* Footer info: Due date & Quick Progress Buttons */}
        <div className="flex items-center justify-between pt-1 border-t border-border/60 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="size-3 text-muted-foreground shrink-0" />
            <span>Tenggat: {formatDate(target.dueDate)}</span>
          </div>

          {target.status === "aktif" && canEdit && (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={handleQuickSubtractProgress}
                disabled={target.currentValue <= 0}
                className="h-6 px-1.5 text-[10px] font-medium gap-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                title={`Kurangi 1 ${target.unit}`}
              >
                <Minus className="size-3" /> 1 {target.unit}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleQuickAddProgress}
                className="h-6 px-1.5 text-[10px] font-medium gap-0.5 text-primary hover:bg-primary/10"
                title={`Tambah 1 ${target.unit}`}
              >
                <Plus className="size-3" /> 1 {target.unit}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
