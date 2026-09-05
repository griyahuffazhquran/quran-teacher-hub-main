import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  Filter,
  MessageSquare,
  MessageSquareText,
  ShieldAlert,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { ActivityTimeline } from "@/components/activity/ActivityTimeline";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ReportDetailDrawer } from "@/components/reports/ReportDetailDrawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListPagination } from "@/components/ui/pagination";
import { useCollection } from "@/hooks/use-repository";
import { useSession } from "@/hooks/use-session";
import { notificationRepo, reportRepo, teacherRepo } from "@/lib/data/repositories";
import { activeReports, unreadCount } from "@/lib/data/selectors";
import type { NotificationItem, NotificationType, Report } from "@/lib/data/types";
import {
  clearAllNotifications,
  deleteNotification,
  markAllAsRead,
  markAsRead,
  notificationsFor,
} from "@/lib/services/notification-service";
import { NotificationDetailDialog } from "@/components/notifications/NotificationDetailDialog";
import { listTeachers } from "@/lib/services/teacher-service";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifikasi & Aktivitas | Griya Huffazh Quran" },
      { name: "description", content: "Pemberitahuan dan riwayat aktivitas upgrading Anda." },
      { property: "og:title", content: "Notifikasi & Aktivitas | Griya Huffazh Quran" },
      { property: "og:description", content: "Pemberitahuan dan riwayat aktivitas upgrading Anda." },
    ],
  }),
  component: Page,
});

function getNotificationIcon(type?: NotificationType) {
  switch (type) {
    case "REPORT_CREATED":
    case "REPORT_UPDATED":
      return { icon: Sparkles, color: "text-emerald-500 bg-emerald-500/10" };
    case "FEEDBACK_CREATED":
      return { icon: MessageSquareText, color: "text-amber-500 bg-amber-500/10" };
    case "COMMENT_CREATED":
      return { icon: MessageSquare, color: "text-indigo-500 bg-indigo-500/10" };
    case "HOMEWORK_PENDING":
      return { icon: Clock, color: "text-orange-500 bg-orange-500/10" };
    default:
      return { icon: Bell, color: "text-primary bg-primary/10" };
  }
}

function Page() {
  const { rows: allNotifications, ready } = useCollection(notificationRepo);
  const { rows: reportRows } = useCollection(reportRepo);
  const { rows: teacherRows } = useCollection(teacherRepo);
  const { user } = useSession();

  const teachers = useMemo(() => listTeachers(teacherRows), [teacherRows]);
  const reports = useMemo(() => activeReports(reportRows), [reportRows]);

  const userNotifications = useMemo(
    () => notificationsFor(allNotifications, user?.id, user?.name),
    [allNotifications, user],
  );

  const unread = unreadCount(userNotifications);

  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const filteredNotifications = useMemo(() => {
    return userNotifications.filter((n) => {
      if (typeFilter === "all") return true;
      if (typeFilter === "unread") return !n.read;
      return n.type === typeFilter;
    });
  }, [userNotifications, typeFilter]);

  const totalPages = Math.ceil(filteredNotifications.length / 10);
  const paginatedNotifications = filteredNotifications.slice((page - 1) * 10, page * 10);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [clearAllConfirmOpen, setClearAllConfirmOpen] = useState(false);

  const handleMarkAllRead = () => {
    markAllAsRead(user?.id);
    toast.success("Semua notifikasi ditandai dibaca.");
  };

  const handleClearAll = () => {
    setClearAllConfirmOpen(true);
  };

  const handleNotificationClick = (n: NotificationItem) => {
    if (!n.read) markAsRead(n.id);
    setSelectedNotification(n);
    setDetailModalOpen(true);
  };

  const handleDeleteItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteTargetId(id);
  };

  return (
    <AppShell>
      <PageHeader
        title="Notifikasi & Timeline"
        description={
          ready
            ? `${unread} notifikasi belum dibaca`
            : "Pemberitahuan dan riwayat aktivitas upgrading Anda."
        }
        actions={
          ready && userNotifications.length > 0 ? (
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="text-xs">
                  <CheckCheck className="mr-1 size-3.5" /> Tandai Dibaca
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-xs text-muted-foreground hover:text-destructive">
                Bersihkan
              </Button>
            </div>
          ) : undefined
        }
      />

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList className="w-full justify-start sm:w-auto">
          <TabsTrigger value="notifications" className="text-xs font-semibold gap-1.5">
            <span>Pemberitahuan</span>
            {unread > 0 && (
              <Badge variant="destructive" className="px-1.5 py-0 text-[10px] rounded-full">
                {unread}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs font-semibold">
            Activity Timeline
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: NOTIFIKASI */}
        <TabsContent value="notifications" className="mt-4 space-y-3">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-card p-3 rounded-xl border border-border">
            <div className="flex items-center gap-2">
              <Filter className="size-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Filter Notifikasi:</span>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 text-xs w-48">
                <SelectValue placeholder="Semua Notifikasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Notifikasi</SelectItem>
                <SelectItem value="unread">Belum Dibaca ({unread})</SelectItem>
                <SelectItem value="REPORT_CREATED">Setoran Baru</SelectItem>
                <SelectItem value="FEEDBACK_CREATED">Feedback</SelectItem>
                <SelectItem value="COMMENT_CREATED">Komentar</SelectItem>
                <SelectItem value="HOMEWORK_PENDING">PR Aktif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!ready ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-xs text-muted-foreground">
                <Bell className="mx-auto size-8 text-muted-foreground/50 mb-2" />
                <span>Tidak ada pemberitahuan pada kategori ini.</span>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2.5 animate-fade-up">
              {paginatedNotifications.map((n) => {
                const iconInfo = getNotificationIcon(n.type);
                const IconComp = iconInfo.icon;

                return (
                  <Card
                    key={n.id}
                    className={`relative overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-lg cursor-pointer group ${
                      n.read
                        ? "opacity-75 bg-card hover:bg-card/90"
                        : "bg-card/95 border-primary/40 shadow-sm ring-1 ring-primary/20"
                    }`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    {!n.read && (
                      <div className="absolute top-0 left-0 bottom-0 w-1 bg-primary animate-pulse" />
                    )}
                    <CardContent className="flex items-start gap-3 p-3.5 pl-4">
                      {/* Icon */}
                      <div className={`grid size-9 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 ${iconInfo.color}`}>
                        <IconComp className="size-4" />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                            {n.title}
                            {!n.read && (
                              <span className="relative flex size-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex size-2 rounded-full bg-primary"></span>
                              </span>
                            )}
                          </p>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {new Date(n.createdAt).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {n.body}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {!n.read ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[11px] px-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(n.id);
                            }}
                          >
                            Tandai dibaca
                          </Button>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            Dibaca
                          </Badge>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                          onClick={(e) => handleDeleteItem(e, n.id)}
                          title="Hapus notifikasi"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              <ListPagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                totalItems={filteredNotifications.length}
                pageSize={10}
              />
            </div>
          )}
        </TabsContent>

        {/* TAB 2: ACTIVITY TIMELINE */}
        <TabsContent value="timeline" className="mt-4">
          <ActivityTimeline limit={25} />
        </TabsContent>
      </Tabs>

      {/* Full Notification Detail Modal */}
      <NotificationDetailDialog
        notification={selectedNotification}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onOpenReport={(repId) => {
          const rep = reports.find((r) => r.id === repId);
          if (rep) {
            setSelectedReport(rep);
            setDrawerOpen(true);
          }
        }}
      />

      {/* Report Detail Drawer when clicking notification */}
      <ReportDetailDrawer
        report={selectedReport}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        teachers={teachers}
        canEdit={
          selectedReport
            ? user?.role === "upgrader" || selectedReport.mustamiId === user?.id
            : false
        }
        currentUserId={user?.id}
      />

      {/* Confirm Delete Single Notification */}
      <ConfirmDeleteDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        title="Konfirmasi Hapus Notifikasi"
        description="Apakah Anda yakin ingin menghapus notifikasi ini?"
        onConfirm={() => {
          if (deleteTargetId) {
            deleteNotification(deleteTargetId);
            toast.success("Notifikasi berhasil dihapus.");
            setDeleteTargetId(null);
          }
        }}
      />

      {/* Confirm Clear All Notifications */}
      <ConfirmDeleteDialog
        open={clearAllConfirmOpen}
        onOpenChange={setClearAllConfirmOpen}
        title="Bersihkan Semua Notifikasi"
        description="Apakah Anda yakin ingin menghapus seluruh notifikasi Anda?"
        onConfirm={() => {
          clearAllNotifications(user?.id);
          toast.success("Semua notifikasi berhasil dibersihkan.");
          setClearAllConfirmOpen(false);
        }}
      />
    </AppShell>
  );
}
