import { Bell, Calendar, Check, ExternalLink, Sparkles, MessageSquare, MessageSquareText, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { NotificationItem, NotificationType } from "@/lib/data/types";
import { markAsRead } from "@/lib/services/notification-service";

type NotificationDetailDialogProps = {
  notification: NotificationItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenReport?: (reportId: string) => void;
};

function getNotificationIcon(type?: NotificationType) {
  switch (type) {
    case "REPORT_CREATED":
    case "REPORT_UPDATED":
      return { icon: Sparkles, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" };
    case "FEEDBACK_CREATED":
      return { icon: MessageSquareText, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" };
    case "COMMENT_CREATED":
      return { icon: MessageSquare, color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20" };
    case "HOMEWORK_PENDING":
      return { icon: Clock, color: "text-orange-500 bg-orange-500/10 border-orange-500/20" };
    default:
      return { icon: Bell, color: "text-primary bg-primary/10 border-primary/20" };
  }
}

export function NotificationDetailDialog({
  notification,
  open,
  onOpenChange,
  onOpenReport,
}: NotificationDetailDialogProps) {
  if (!notification) return null;

  const iconInfo = getNotificationIcon(notification.type);
  const IconComp = iconInfo.icon;

  const handleRead = () => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const handleGoToReport = () => {
    if (notification.reportId && onOpenReport) {
      handleRead();
      onOpenChange(false);
      onOpenReport(notification.reportId);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (val) handleRead();
        onOpenChange(val);
      }}
    >
      <DialogContent className="max-w-md p-6 space-y-4 rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-3 text-left">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className={`grid size-10 place-items-center rounded-xl border ${iconInfo.color}`}>
                <IconComp className="size-5" />
              </div>
              <div>
                <Badge
                  variant={
                    notification.level === "warning"
                      ? "destructive"
                      : notification.level === "success"
                      ? "default"
                      : "secondary"
                  }
                  className="text-[10px] uppercase font-bold tracking-wider"
                >
                  {notification.level || "Notifikasi"}
                </Badge>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                  <Calendar className="size-3" />
                  <span>
                    {new Date(notification.createdAt).toLocaleDateString("id-ID", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>

            {!notification.read && (
              <Badge variant="outline" className="text-[10px] text-primary border-primary animate-pulse">
                Baru
              </Badge>
            )}
          </div>

          <DialogTitle className="text-base font-bold leading-snug text-foreground">
            {notification.title}
          </DialogTitle>
        </DialogHeader>

        {/* Full Message Body */}
        <div className="p-4 rounded-xl bg-muted/50 border border-border text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto font-sans">
          {notification.body}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2 sm:justify-between sm:items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              handleRead();
              onOpenChange(false);
            }}
            className="text-xs"
          >
            Tutup
          </Button>

          {notification.reportId && onOpenReport && (
            <Button
              size="sm"
              onClick={handleGoToReport}
              className="text-xs font-semibold gap-1.5 shadow-sm"
            >
              <span>Lihat Details Setoran</span>
              <ExternalLink className="size-3.5" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
