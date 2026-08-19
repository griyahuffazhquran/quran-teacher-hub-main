import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpDown,
  BookCheck,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  GraduationCap,
  LayoutGrid,
  Plus,
  Search,
  Table as TableIcon,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { AnnouncementBanner } from "@/components/announcements/AnnouncementBanner";
import { ReportCard } from "@/components/reports/ReportCard";
import { ReportDetailDrawer } from "@/components/reports/ReportDetailDrawer";
import { ReportFormDialog } from "@/components/reports/ReportFormDialog";
import { ReportTable } from "@/components/reports/ReportTable";
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
import { reportRepo, teacherRepo } from "@/lib/data/repositories";
import {
  activeReports,
  averageGrade,
  formatDate,
  gradeOptions,
  isThisMonth,
  materialOptions,
  pendingHomework,
  sortByDateDesc,
  teacherName,
} from "@/lib/data/selectors";
import type { Grade, MaterialType, Report, ReportStatus } from "@/lib/data/types";
import {
  assessmentsOf,
  progressOf,
  softDeleteReport,
  toggleHomework,
} from "@/lib/services/report-service";
import { listTeachers } from "@/lib/services/teacher-service";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Teacher Dashboard | Griya Huffazh Quran" },
      {
        name: "description",
        content:
          "Dashboard pengajar Griya Huffazh Quran: pantau progres upgrading setoran hafalan, matn, hadits, dan aktivitas menyimak.",
      },
      { property: "og:title", content: "Teacher Dashboard | Griya Huffazh Quran" },
      {
        property: "og:description",
        content:
          "Dashboard pengajar Griya Huffazh Quran: pantau progres upgrading setoran hafalan, matn, hadits, dan aktivitas menyimak.",
      },
    ],
  }),
  component: Dashboard,
});

type SortOption = "date-desc" | "date-asc" | "grade-desc" | "grade-asc";

const gradeWeight: Record<Grade, number> = { A: 4, B: 3, C: 2, D: 1 };

function calculateProgressPercentage(reports: Report[]): string {
  if (reports.length === 0) return "0%";
  const completed = reports.filter(
    (r) => (r.grade === "A" || r.grade === "B") && (!r.homework || r.homeworkDone),
  ).length;
  const pct = Math.round((completed / reports.length) * 100);
  return `${pct}%`;
}

function Dashboard() {
  const { rows: reportRows, ready } = useCollection(reportRepo);
  const { rows: teacherRows } = useCollection(teacherRepo);
  const { user, isUpgrader, ready: sessionReady } = useSession();

  const teachers = useMemo(() => listTeachers(teacherRows), [teacherRows]);
  const reports = useMemo(() => activeReports(reportRows), [reportRows]);

  // Dialog & Detail Drawer state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | undefined>(undefined);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Search, Filter & Sort state
  const [query, setQuery] = useState("");
  const [materialFilter, setMaterialFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [viewMode, setViewMode] = useState<"grid" | "table">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("dashboard_view_mode") as "grid" | "table") || "grid";
    }
    return "grid";
  });

  const changeViewMode = (mode: "grid" | "table") => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("dashboard_view_mode", mode);
    }
  };

  // Scope metrics calculation
  const scopeProgress = useMemo(() => {
    if (!user) return [];
    return progressOf(reports, user.id);
  }, [reports, user]);

  const scopeAssessments = useMemo(() => {
    if (!user) return [];
    return assessmentsOf(reports, user.id);
  }, [reports, user]);

  const scopeForStats = useMemo(() => {
    if (!user) return reports;
    return isUpgrader ? reports : scopeProgress;
  }, [reports, user, isUpgrader]);

  const avgGrade = averageGrade(scopeForStats);
  const lastSub = sortByDateDesc(scopeForStats)[0];
  const progressPct = calculateProgressPercentage(scopeForStats);

  const stats = [
    {
      label: isUpgrader ? "Total Setoran Lembaga" : "Total Setoran Diterima",
      value: String(scopeForStats.length),
      subtext: isUpgrader ? "Keseluruhan guru" : "Upgrading saya",
      icon: BookCheck,
      color: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Setoran Bulan Ini",
      value: String(scopeForStats.filter((r) => isThisMonth(r.date)).length),
      subtext: "Bulan berjalan",
      icon: Calendar,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Rata-rata Nilai",
      value: avgGrade ?? "—",
      subtext: avgGrade ? `Predikat ${avgGrade}` : "Belum ada nilai",
      icon: GraduationCap,
      color: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "PR Aktif",
      value: String(pendingHomework(scopeForStats).length),
      subtext: "Membutuhkan tindak lanjut",
      icon: Clock,
      color: "text-orange-600 dark:text-orange-400",
    },
    {
      label: "Tingkat Tuntas / Progress",
      value: progressPct,
      subtext: "Nilai baik & PR selesai",
      icon: TrendingUp,
      color: "text-teal-600 dark:text-teal-400",
    },
    {
      label: "Setoran Terakhir",
      value: lastSub ? formatDate(lastSub.date) : "—",
      subtext: lastSub ? `${lastSub.materialDetail}` : "Belum ada aktivitas",
      icon: CheckCircle2,
      color: "text-indigo-600 dark:text-indigo-400",
    },
  ];

  // Helper for applying search, filters, and sorting
  const filterAndSort = (rows: Report[]) => {
    const q = query.trim().toLowerCase();

    const filtered = rows.filter((r) => {
      // Material filter
      if (materialFilter !== "all" && r.material !== materialFilter) return false;
      // Grade filter
      if (gradeFilter !== "all" && r.grade !== gradeFilter) return false;
      // Status filter
      if (statusFilter !== "all" && r.status !== statusFilter) return false;

      // Text query
      if (!q) return true;
      const assessed = teacherName(teachers, r.teacherId);
      const searchTarget = [
        assessed,
        r.mustamiName,
        r.materialDetail,
        r.reference,
        r.mustamiNote ?? "",
        r.homework ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return searchTarget.includes(q);
    });

    // Sorting
    return [...filtered].sort((a, b) => {
      if (sortBy === "date-desc") return b.date.localeCompare(a.date);
      if (sortBy === "date-asc") return a.date.localeCompare(b.date);
      if (sortBy === "grade-desc") return (gradeWeight[b.grade] ?? 0) - (gradeWeight[a.grade] ?? 0);
      if (sortBy === "grade-asc") return (gradeWeight[a.grade] ?? 0) - (gradeWeight[b.grade] ?? 0);
      return 0;
    });
  };

  const filteredProgress = useMemo(
    () => filterAndSort(scopeProgress),
    [scopeProgress, query, materialFilter, gradeFilter, statusFilter, sortBy, teachers],
  );

  const filteredAssessments = useMemo(
    () => filterAndSort(scopeAssessments),
    [scopeAssessments, query, materialFilter, gradeFilter, statusFilter, sortBy, teachers],
  );

  const filteredAll = useMemo(
    () => filterAndSort(reports),
    [reports, query, materialFilter, gradeFilter, statusFilter, sortBy, teachers],
  );

  // Actions
  const handleOpenDetail = (report: Report) => {
    setSelectedReport(report);
    setDrawerOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingReport(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (report: Report) => {
    setEditingReport(report);
    setDialogOpen(true);
  };

  const handleDelete = (report: Report, mode: "permanent" | "soft" = "permanent") => {
    if (!user) return;
    if (mode === "permanent") {
      reportRepo.remove(report.id);
      toast.success("Setoran berhasil dihapus permanen (clear database).");
    } else {
      softDeleteReport(report.id, user.id);
      toast.success("Setoran diarsipkan.");
    }
    if (selectedReport?.id === report.id) {
      setDrawerOpen(false);
      setSelectedReport(null);
    }
  };

  const handleToggleHomework = (report: Report) => {
    if (!user) return;
    const updated = toggleHomework(report.id, user.id);
    if (updated) {
      toast.success(
        updated.homeworkDone ? "PR ditandai selesai!" : "Status PR dikembalikan belum selesai.",
      );
      if (selectedReport?.id === report.id) {
        setSelectedReport(updated);
      }
    }
  };

  const renderReportList = (rows: Report[], canEdit: boolean, emptyMessage: string) => {
    if (!ready || !sessionReady) {
      return (
        <div className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
        </div>
      );
    }

    if (rows.length === 0) {
      return (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
              <BookCheck className="size-6 text-muted-foreground" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-foreground">Tidak Ada Setoran Found</h3>
            <p className="mt-1 text-xs text-muted-foreground">{emptyMessage}</p>
            {(query || materialFilter !== "all" || gradeFilter !== "all" || statusFilter !== "all") && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 text-xs"
                onClick={() => {
                  setQuery("");
                  setMaterialFilter("all");
                  setGradeFilter("all");
                  setStatusFilter("all");
                }}
              >
                Reset Filter
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }

    if (viewMode === "table") {
      return (
        <ReportTable
          reports={rows}
          teachers={teachers}
          canEdit={canEdit}
          currentUserId={user?.id}
          onSelect={handleOpenDetail}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleHomework={handleToggleHomework}
        />
      );
    }

    return (
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 animate-fade-up">
        {rows.map((r) => (
          <ReportCard
            key={r.id}
            report={r}
            teachers={teachers}
            canEdit={canEdit}
            onSelect={handleOpenDetail}
            onEdit={handleEdit}
            onDelete={handleDelete}
            {...(r.homework && (canEdit || r.teacherId === user?.id)
              ? { onToggleHomework: handleToggleHomework }
              : {})}
          />
        ))}
      </div>
    );
  };

  return (
    <AppShell>
      {/* Page Header */}
      <PageHeader
        title="Teacher Dashboard"
        description={
          user
            ? `Assalamu'alaikum, ${user.name}. Pantau progres setoran upgrading & aktivitas menyimak Anda.`
            : "Sistem Manajemen Upgrading Guru Griya Huffazh Quran."
        }
        actions={
          user ? (
            <Button onClick={handleOpenCreate} className="shadow-sm font-medium">
              <Plus className="mr-1.5 size-4" /> Setoran Baru
            </Button>
          ) : null
        }
      />

      {/* Pinned Institutional Announcement Banner */}
      <AnnouncementBanner />

      {/* Overview Statistics Grid (6 Cards) */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6 mb-6">
        {stats.map((st) => {
          const IconComp = st.icon;
          return (
            <Card key={st.label} className="relative overflow-hidden transition-all hover:shadow-md">
              <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-[11px] font-semibold text-muted-foreground leading-snug">
                  {st.label}
                </CardTitle>
                <IconComp className={`size-4 ${st.color} shrink-0`} />
              </CardHeader>
              <CardContent className="p-3.5 pt-1">
                {ready ? (
                  <>
                    <p className="text-xl font-bold text-foreground tracking-tight">{st.value}</p>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">{st.subtext}</p>
                  </>
                ) : (
                  <Skeleton className="h-7 w-14" />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dashboard Main Content with Tabs */}
      <Tabs defaultValue="progress" className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
            <TabsTrigger value="progress" className="text-xs font-semibold gap-1.5">
              <span>My Upgrading Progress</span>
              {ready && (
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] rounded-full">
                  {scopeProgress.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="assessment" className="text-xs font-semibold gap-1.5">
              <span>My Assessment Activity</span>
              {ready && (
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] rounded-full">
                  {scopeAssessments.length}
                </Badge>
              )}
            </TabsTrigger>
            {isUpgrader && (
              <TabsTrigger value="all" className="text-xs font-semibold gap-1.5">
                <span>Semua Setoran Lembaga</span>
                {ready && (
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px] rounded-full">
                    {reports.length}
                  </Badge>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          {/* View Switcher Toggle */}
          <div className="flex items-center rounded-lg border border-border bg-muted/40 p-1 self-start lg:self-auto">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => changeViewMode("grid")}
              className="h-7 px-2.5 text-xs font-medium gap-1.5"
            >
              <LayoutGrid className="size-3.5" />
              <span>Kartu</span>
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => changeViewMode("table")}
              className="h-7 px-2.5 text-xs font-medium gap-1.5"
            >
              <TableIcon className="size-3.5" />
              <span>Tabel</span>
            </Button>
          </div>
        </div>

        {/* Toolbar Controls: Search, Filter & Sorting */}
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-5 bg-card p-3 rounded-xl border border-border">
          {/* Search Input */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama guru, mustami', materi, ayat..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8 text-xs h-9"
            />
          </div>

          {/* Material Filter */}
          <Select value={materialFilter} onValueChange={setMaterialFilter}>
            <SelectTrigger className="h-9 text-xs">
              <div className="flex items-center gap-1.5 truncate">
                <Filter className="size-3 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Materi" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Materi</SelectItem>
              {materialOptions.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Grade Filter */}
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Nilai" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Nilai</SelectItem>
              {gradeOptions.map((g) => (
                <SelectItem key={g} value={g}>
                  Nilai {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sorting */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="h-9 text-xs">
              <div className="flex items-center gap-1.5 truncate">
                <ArrowUpDown className="size-3 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Urutan" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Terbaru (Tanggal)</SelectItem>
              <SelectItem value="date-asc">Terlama (Tanggal)</SelectItem>
              <SelectItem value="grade-desc">Nilai A → D</SelectItem>
              <SelectItem value="grade-asc">Nilai D → A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tab 1: My Upgrading Progress */}
        <TabsContent value="progress" className="mt-4 space-y-3">
          {renderReportList(
            filteredProgress,
            false,
            "Belum ada setoran yang disimak oleh guru lain untuk Anda.",
          )}
        </TabsContent>

        {/* Tab 2: My Assessment Activity */}
        <TabsContent value="assessment" className="mt-4 space-y-3">
          {renderReportList(
            filteredAssessments,
            true,
            "Anda belum mencatat setoran guru lain sebagai Mustami'.",
          )}
        </TabsContent>

        {/* Tab 3: All Reports (Upgrader only) */}
        {isUpgrader && (
          <TabsContent value="all" className="mt-4 space-y-3">
            {renderReportList(
              filteredAll,
              true,
              "Belum ada setoran tercatat di seluruh sistem.",
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Form Dialog for Creating & Editing */}
      {user && (
        <ReportFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          currentUser={user}
          teachers={teachers}
          reports={reportRows}
          editing={editingReport}
        />
      )}

      {/* Detail Drawer Component */}
      <ReportDetailDrawer
        report={selectedReport}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        teachers={teachers}
        canEdit={
          selectedReport
            ? isUpgrader || selectedReport.mustamiId === user?.id
            : false
        }
        currentUserId={user?.id}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleHomework={handleToggleHomework}
      />
    </AppShell>
  );
}
