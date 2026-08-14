import {
  Activity,
  BookOpen,
  CheckCircle2,
  Clock,
  MessageSquare,
  MessageSquareText,
  Pencil,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useCollection } from "@/hooks/use-repository";
import { activityRepo } from "@/lib/data/repositories";
import type { ActivityLog } from "@/lib/data/types";
import { listActivityLogs } from "@/lib/services/notification-service";

function getActionInfo(action: string) {
  switch (action) {
    case "REPORT_CREATED":
      return {
        label: "Setoran Dibuat",
        icon: BookOpen,
        color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      };
    case "REPORT_UPDATED":
      return {
        label: "Setoran Diperbarui",
        icon: Pencil,
        color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
      };
    case "REPORT_DELETED":
      return {
        label: "Setoran Dihapus",
        icon: Trash2,
        color: "text-destructive bg-destructive/10 border-destructive/20",
      };
    case "FEEDBACK_CREATED":
      return {
        label: "Feedback Baru",
        icon: MessageSquareText,
        color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      };
    case "COMMENT_CREATED":
      return {
        label: "Komentar Baru",
        icon: MessageSquare,
        color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
      };
    case "HOMEWORK_UPDATED":
      return {
        label: "Status PR",
        icon: CheckCircle2,
        color: "text-teal-500 bg-teal-500/10 border-teal-500/20",
      };
    default:
      return {
        label: "Aktivitas",
        icon: Activity,
        color: "text-primary bg-primary/10 border-primary/20",
      };
  }
}

function formatRelativeTime(dateISO: string): string {
  const d = new Date(dateISO);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "Baru saja";
  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffHour < 24) return `${diffHour} jam lalu`;
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

export function ActivityTimeline({ limit = 15 }: { limit?: number }) {
  const { rows: logs } = useCollection(activityRepo);
  const recentLogs = listActivityLogs(logs, limit);

  if (recentLogs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-xs text-muted-foreground">
          Belum ada riwayat aktivitas yang tercatat.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative space-y-3 pl-3 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
      {recentLogs.map((log) => {
        const info = getActionInfo(log.action);
        const IconComp = info.icon;

        return (
          <div key={log.id} className="relative flex items-start gap-3 pl-4 group">
            {/* Timeline Dot Icon */}
            <div
              className={`absolute -left-3 top-0.5 flex size-6 items-center justify-center rounded-full border shadow-2xs transition-transform group-hover:scale-110 ${info.color}`}
            >
              <IconComp className="size-3" />
            </div>

            {/* Content Card */}
            <div className="flex-1 rounded-xl border border-border/80 bg-card p-3 shadow-2xs space-y-1 transition-all group-hover:border-primary/30">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">
                    {info.label}
                  </Badge>
                  {log.actorName && (
                    <span className="font-semibold text-xs text-foreground truncate">
                      {log.actorName}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {formatRelativeTime(log.createdAt)}
                </span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {log.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
