import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  BellPlus,
  Calendar as CalendarIcon,
  CheckCircle2,
  Download,
  Filter,
  Plus,
  Search,
  Target as TargetIcon,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { exportTargetsCSV } from "@/lib/services/reporting-export-service";
import { UpgradeCalendar } from "@/components/calendar/UpgradeCalendar";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ReportDetailDrawer } from "@/components/reports/ReportDetailDrawer";
import { TargetCard } from "@/components/targets/TargetCard";
import { TargetDetailDrawer } from "@/components/targets/TargetDetailDrawer";
import { TargetFormDialog } from "@/components/targets/TargetFormDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollection } from "@/hooks/use-repository";
import { useSession } from "@/hooks/use-session";
import {
  reminderRepo,
  reportRepo,
  targetRepo,
  teacherRepo,
} from "@/lib/data/repositories";
import {
  activeReports,
  formatDate,
  teacherName,
} from "@/lib/data/selectors";
import type { Target, Teacher } from "@/lib/data/types";
import {
  deleteReminder,
  dismissReminder,
  remindersForTeacher,
} from "@/lib/services/reminder-service";
import {
  listActiveTargets,
  softDeleteTarget,
} from "@/lib/services/target-service";
import { listTeachers } from "@/lib/services/teacher-service";

export const Route = createFileRoute("/targets")({
  head: () => ({
    meta: [
      { title: "Target & Reminders | Griya Huffazh Quran" },
      { name: "description", content: "Target pengembangan guru, pengingat, dan kalender upgrading." },
      { property: "og:title", content: "Target & Reminders | Griya Huffazh Quran" },
      { property: "og:description", content: "Target pengembangan guru, pengingat, dan kalender upgrading." },
    ],
  }),
  component: Page,
});

function Page() {
  const { rows: targetRows, ready: targetsReady } = useCollection(targetRepo);
  const { rows: reminderRows, ready: remindersReady } = useCollection(reminderRepo);
  const { rows: reportRows } = useCollection(reportRepo);
  const { rows: teacherRows } = useCollection(teacherRepo);
  const { user, isUpgrader, ready: sessionReady } = useSession();

  const teachers = useMemo(() => listTeachers(teacherRows), [teacherRows]);
  const reports = useMemo(() => activeReports(reportRows), [reportRows]);
  const targets = useMemo(() => listActiveTargets(targetRows), [targetRows]);

  // Dialog & Drawer state
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<Target | undefined>(undefined);
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  // Selected report for calendar drawer view
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [reportDrawerOpen, setReportDrawerOpen] = useState(false);

  // Search & Filter state
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [teacherFilter, setTeacherFilter] = useState<string>("all");

  // User scoped targets
  const userTargets = useMemo(() => {
    if (!user) return targets;
    if (isUpgrader) return targets;
    return targets.filter((t) => t.teacherId === user.id);
  }, [targets, user, isUpgrader]);

  const userReminders = useMemo(() => {
    return remindersForTeacher(reminderRows, isUpgrader ? undefined : user?.id);
  }, [reminderRows, isUpgrader, user]);

  // Filtered target list
  const filteredTargets = useMemo(() => {
    const q = query.trim().toLowerCase();
    return userTargets.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (periodFilter !== "all" && t.period !== periodFilter) return false;
      if (teacherFilter !== "all" && t.teacherId !== teacherFilter) return false;

      if (!q) return true;
      const tName = teacherName(teachers, t.teacherId).toLowerCase();
      const title = t.title.toLowerCase();
      const desc = (t.description || "").toLowerCase();
      return title.includes(q) || tName.includes(q) || desc.includes(q);
    });
  }, [userTargets, query, statusFilter, periodFilter, teacherFilter, teachers]);

  // Stats calculation
  const totalCount = userTargets.length;
  const activeCount = userTargets.filter((t) => t.status === "aktif").length;
  const completedCount = userTargets.filter((t) => t.status === "tercapai").length;
  const reminderCount = userReminders.filter((r) => !r.dismissed).length;

  const handleOpenCreate = () => {
    setEditingTarget(undefined);
    setFormDialogOpen(true);
  };

  const handleEdit = (target: Target) => {
    setEditingTarget(target);
    setFormDialogOpen(true);
  };

  const handleDelete = (target: Target) => {
    softDeleteTarget(target.id, user?.id);
    toast.success("Target berhasil dihapus.");
    if (selectedTarget?.id === target.id) {
      setDetailDrawerOpen(false);
      setSelectedTarget(null);
    }
  };

  const handleSelectTarget = (target: Target) => {
    setSelectedTarget(target);
    setDetailDrawerOpen(true);
  };

  const handleAddReminderForTarget = (target: Target) => {
    setSelectedTarget(target);
    setDetailDrawerOpen(true);
  };

  return (
    <AppShell>
      {/* Header */}
      <PageHeader
        title="Target & Reminders Upgrading"
        description="Kelola target hafalan guru, jadwalkan pengingat, dan pantau kalender upgrading."
        action={
          user ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  exportTargetsCSV(targetRows, teacherRows);
                  toast.success("Laporan target berhasil diunduh (CSV).");
                }}
                className="gap-1.5 shadow-xs text-xs h-9"
              >
                <Download className="size-3.5" />
                <span>Ekspor CSV</span>
              </Button>
              <Button onClick={handleOpenCreate} className="shadow-xs gap-1.5 text-xs h-9">
                <Plus className="size-4" /> Target Baru
              </Button>
            </div>
          ) : null
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-6">
        <Card className="p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Total Target</span>
            <TargetIcon className="size-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">{targetsReady ? totalCount : "—"}</p>
          <p className="text-[10px] text-muted-foreground truncate">Target upgrading tercatat</p>
        </Card>

        <Card className="p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Target Aktif</span>
            <TrendingUp className="size-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">{targetsReady ? activeCount : "—"}</p>
          <p className="text-[10px] text-muted-foreground truncate">Dalam proses pencapaian</p>
        </Card>

        <Card className="p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Target Tercapai</span>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">{targetsReady ? completedCount : "—"}</p>
          <p className="text-[10px] text-muted-foreground truncate">Tuntas tuntas 100%</p>
        </Card>

        <Card className="p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Pengingat Aktif</span>
            <Bell className="size-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">{remindersReady ? reminderCount : "—"}</p>
          <p className="text-[10px] text-muted-foreground truncate">Reminder terjadwal</p>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="list" className="text-xs font-semibold gap-1.5">
            <TargetIcon className="size-3.5" />
            <span>Daftar Target</span>
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] rounded-full">
              {filteredTargets.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="reminders" className="text-xs font-semibold gap-1.5">
            <Bell className="size-3.5" />
            <span>Pengingat / Reminders</span>
            {reminderCount > 0 && (
              <Badge variant="destructive" className="px-1.5 py-0 text-[10px] rounded-full">
                {reminderCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="calendar" className="text-xs font-semibold gap-1.5">
            <CalendarIcon className="size-3.5" />
            <span>Kalender Upgrading</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: DAFTAR TARGET */}
        <TabsContent value="list" className="mt-4 space-y-4">
          {/* Controls Bar */}
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4 bg-card p-3 rounded-xl border border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari judul target, nama guru..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 text-xs">
                <div className="flex items-center gap-1 truncate">
                  <Filter className="size-3 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Status Target" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="aktif">Aktif</SelectItem>
                <SelectItem value="tercapai">Tercapai</SelectItem>
                <SelectItem value="gagal">Gagal</SelectItem>
              </SelectContent>
            </Select>

            {/* Period Filter */}
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Periode</SelectItem>
                <SelectItem value="bulanan">Bulanan</SelectItem>
                <SelectItem value="semester">Semester</SelectItem>
                <SelectItem value="tahunan">Tahunan</SelectItem>
              </SelectContent>
            </Select>

            {/* Teacher Filter (For Upgrader) */}
            {isUpgrader && (
              <Select value={teacherFilter} onValueChange={setTeacherFilter}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Pengajar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Guru</SelectItem>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {!targetsReady || !sessionReady ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-44 w-full rounded-xl" />
              <Skeleton className="h-44 w-full rounded-xl" />
              <Skeleton className="h-44 w-full rounded-xl" />
            </div>
          ) : filteredTargets.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-xs text-muted-foreground">
                <TargetIcon className="mx-auto size-8 text-muted-foreground/40 mb-2" />
                <p className="font-semibold text-sm text-foreground">Tidak Ada Target Ditemukan</p>
                <p className="mt-1">Coba atur ulang filter pencarian Anda atau buat target baru.</p>
                {user && (
                  <Button onClick={handleOpenCreate} size="sm" className="mt-4 text-xs font-medium">
                    <Plus className="mr-1 size-3.5" /> Buat Target Baru
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 animate-fade-up">
              {filteredTargets.map((t) => (
                <TargetCard
                  key={t.id}
                  target={t}
                  teachers={teachers}
                  canEdit={isUpgrader || t.createdBy === user?.id || t.teacherId === user?.id}
                  onSelect={handleSelectTarget}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAddReminder={handleAddReminderForTarget}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: REMINDERS LIST */}
        <TabsContent value="reminders" className="mt-4 space-y-3">
          <div className="flex items-center justify-between bg-card p-3 rounded-xl border border-border">
            <span className="text-xs font-medium text-muted-foreground">
              Daftar Pengingat & Reminder Aktif
            </span>
          </div>

          {!remindersReady ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          ) : userReminders.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-xs text-muted-foreground">
                <Bell className="mx-auto size-8 text-muted-foreground/40 mb-2" />
                <p className="font-semibold text-sm text-foreground">Belum Ada Pengingat</p>
                <p className="mt-1">Tambahkan pengingat pada target upgrading Anda untuk mendapatkan notifikasi.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 animate-fade-up">
              {userReminders.map((r) => {
                const targetObj = targets.find((t) => t.id === r.targetId);

                return (
                  <Card key={r.id} className={r.dismissed ? "opacity-70 bg-card" : "bg-card border-amber-500/30"}>
                    <CardContent className="p-3.5 flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {r.frequency}
                          </Badge>
                          {targetObj && (
                            <Badge variant="secondary" className="text-[10px]">
                              Target: {targetObj.title}
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-bold text-xs text-foreground">{r.title}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{r.message}</p>
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                          Diingatkan pada: {formatDate(r.remindAt)} • Pengajar: {teacherName(teachers, r.teacherId)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {!r.dismissed ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs font-medium gap-1 text-emerald-600"
                            onClick={() => {
                              dismissReminder(r.id);
                              toast.success("Pengingat ditandai selesai.");
                            }}
                          >
                            <CheckCircle2 className="size-3.5" /> Selesai
                          </Button>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            Selesai
                          </Badge>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            deleteReminder(r.id);
                            toast.success("Pengingat dihapus.");
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB 3: KALENDER UPGRADING */}
        <TabsContent value="calendar" className="mt-4">
          <UpgradeCalendar
            reports={reports}
            targets={targets}
            reminders={reminderRows}
            teachers={teachers}
            onSelectReport={(r) => {
              setSelectedReport(r);
              setReportDrawerOpen(true);
            }}
            onSelectTarget={(t) => {
              setSelectedTarget(t);
              setDetailDrawerOpen(true);
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Target Form Dialog (Create & Edit) */}
      {user && (
        <TargetFormDialog
          open={formDialogOpen}
          onOpenChange={setFormDialogOpen}
          currentUser={user}
          teachers={teachers}
          editing={editingTarget}
        />
      )}

      {/* Target Detail Drawer */}
      <TargetDetailDrawer
        target={selectedTarget}
        open={detailDrawerOpen}
        onOpenChange={setDetailDrawerOpen}
        teachers={teachers}
        canEdit={
          selectedTarget
            ? isUpgrader || selectedTarget.createdBy === user?.id || selectedTarget.teacherId === user?.id
            : false
        }
        currentUserId={user?.id}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Report Detail Drawer for Calendar view triggers */}
      <ReportDetailDrawer
        report={selectedReport}
        open={reportDrawerOpen}
        onOpenChange={setReportDrawerOpen}
        teachers={teachers}
        canEdit={
          selectedReport
            ? isUpgrader || selectedReport.mustamiId === user?.id
            : false
        }
        currentUserId={user?.id}
      />
    </AppShell>
  );
}
