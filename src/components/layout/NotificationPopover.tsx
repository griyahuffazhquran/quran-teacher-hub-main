import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, CheckCheck, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NotificationDetailDialog } from "@/components/notifications/NotificationDetailDialog";
import { useCollection } from "@/hooks/use-repository";
import { useSession } from "@/hooks/use-session";
import { notificationRepo } from "@/lib/data/repositories";
import { unreadCount } from "@/lib/data/selectors";
import type { NotificationItem } from "@/lib/data/types";
import { notificationsFor, markAsRead } from "@/lib/services/notification-service";
import { cn } from "@/lib/utils";

export function NotificationPopover() {
  const [open, setOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const navigate = useNavigate();
  const { user } = useSession();
  const { rows: allRows, ready, repo } = useCollection(notificationRepo);
  const notifications = notificationsFor(allRows, user?.id, user?.name);
  const unread = unreadCount(notifications);
  const recentNotifications = notifications.slice(0, 4);

  const markAllRead = () => {
    notifications.forEach((n) => {
      if (!n.read) void repo.update(n.id, { read: true });
    });
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.read) markAsRead(item.id);
    setSelectedNotif(item);
    setModalOpen(true);
    setOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifikasi"
            className="relative transition-all duration-300 hover:scale-110 active:scale-95 group"
          >
            <Bell className={cn("size-[18px] transition-transform duration-300 group-hover:rotate-12", unread > 0 && "animate-bounce text-primary")} />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex size-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
                <span className="relative grid size-4 place-items-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground shadow-sm">
                  {unread > 9 ? "9+" : unread}
                </span>
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-80 p-0 sm:w-96 animate-zoom-in rounded-2xl border border-border shadow-xl backdrop-blur-md"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
                <Bell className="size-4" />
              </div>
              <span className="font-semibold text-sm">Notifikasi</span>
              {unread > 0 && (
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
                  {unread} baru
                </span>
              )}
            </div>
            {unread > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllRead}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <CheckCheck className="mr-1 size-3.5" /> Tandai Dibaca
              </Button>
            )}
          </div>

          <div className="max-h-72 divide-y divide-border/50 overflow-y-auto">
            {!ready ? (
              <div className="p-4 text-center text-xs text-muted-foreground">Memuat...</div>
            ) : recentNotifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                Belum ada notifikasi.
              </div>
            ) : (
              recentNotifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleNotificationClick(n)}
                  className={cn(
                    "group flex w-full items-start gap-3 p-3.5 text-left transition-colors hover:bg-accent/50",
                    !n.read ? "bg-primary/5" : "opacity-75",
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 size-2 shrink-0 rounded-full transition-all group-hover:scale-125",
                      !n.read ? "bg-primary" : "bg-muted-foreground/30",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground leading-snug">{n.title}</p>
                    <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground leading-relaxed">
                      {n.body}
                    </p>
                  </div>
                  <ChevronRight className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                </button>
              ))
            )}
          </div>

          <div className="border-t border-border bg-muted/30 p-2 text-center">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="w-full text-xs font-medium text-primary hover:text-primary/80"
              onClick={() => setOpen(false)}
            >
              <Link to="/notifications" className="flex items-center justify-center gap-1.5">
                <span>Lihat Semua Notifikasi</span>
                <ExternalLink className="size-3" />
              </Link>
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Full Notification Detail Modal */}
      <NotificationDetailDialog
        notification={selectedNotif}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onOpenReport={(reportId) => {
          void navigate({ to: "/reports", search: { reportId } as any });
        }}
      />
    </>
  );
}
