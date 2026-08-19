import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpDown, Download, Filter, LayoutGrid, Plus, Table as TableIcon } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { exportReportsCSV } from "@/lib/services/reporting-export-service";
import { ReportCard } from "@/components/reports/ReportCard";
import { ReportDetailDrawer } from "@/components/reports/ReportDetailDrawer";
import { ReportFormDialog } from "@/components/reports/ReportFormDialog";
import { ReportTable } from "@/components/reports/ReportTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  gradeOptions,
  materialOptions,
  sortByDateDesc,
} from "@/lib/data/selectors";
import type { Grade, Report } from "@/lib/data/types";
import {
  assessmentsOf,
  progressOf,
  softDeleteReport,
  toggleHomework,
} from "@/lib/services/report-service";
import { listTeachers } from "@/lib/services/teacher-service";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Setoran | Griya Huffazh Quran" },
      { name: "description", content: "Catatan setoran materi dan penilaian mustami'." },
      { property: "og:title", content: "Setoran | Griya Huffazh Quran" },
      { property: "og:description", content: "Catatan setoran materi dan penilaian mustami'." },
    ],
  }),
  component: Page,
});

type SortOption = "date-desc" | "date-asc" | "grade-desc" | "grade-asc";
const gradeWeight: Record<Grade, number> = { A: 4, B: 3, C: 2, D: 1 };

function Page() {
  const { rows: reportRows, ready } = useCollection(reportRepo);
  const { rows: teacherRows } = useCollection(teacherRepo);
  const { user, isUpgrader, ready: sessionReady } = useSession();

  const teachers = useMemo(() => listTeachers(teacherRows), [teacherRows]);
  const reports = useMemo(() => activeReports(reportRows), [reportRows]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Report | undefined>(undefined);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [material, setMaterial] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [viewMode, setViewMode] = useState<"grid" | "table">(
    () => {
      if (typeof window !== "undefined") {
        return (localStorage.getItem("setoran_view_mode") as "grid" | "table") || "grid";
      }
      return "grid";
    },
  );

  const changeViewMode = (mode: "grid" | "table") => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("setoran_view_mode", mode);
    }
  };

  const filterAndSort = (rows: Report[]) => {
    const q = query.trim().toLowerCase();

    const filtered = rows.filter((r) => {
      if (material !== "all" && r.material !== material) return false;
      if (gradeFilter !== "all" && r.grade !== gradeFilter) return false;
      if (!q) return true;
      const name = teachers.find((t) => t.id === r.teacherId)?.name ?? "";
      return [name, r.materialDetail, r.reference, r.mustamiName, r.mustamiNote ?? "", r.homework ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "date-desc") return b.date.localeCompare(a.date);
      if (sortBy === "date-asc") return a.date.localeCompare(b.date);
      if (sortBy === "grade-desc") return (gradeWeight[b.grade] ?? 0) - (gradeWeight[a.grade] ?? 0);
      if (sortBy === "grade-asc") return (gradeWeight[a.grade] ?? 0) - (gradeWeight[b.grade] ?? 0);
      return 0;
    });
  };

  const myProgress = useMemo(
    () => (user ? filterAndSort(progressOf(reports, user.id)) : []),
    [reports, user, query, material, gradeFilter, sortBy, teachers],
  );

  const myAssessments = useMemo(
    () => (user ? filterAndSort(assessmentsOf(reports, user.id)) : []),
    [reports, user, query, material, gradeFilter, sortBy, teachers],
  );

  const allReports = useMemo(
    () => filterAndSort(reports),
    [reports, query, material, gradeFilter, sortBy, teachers],
  );

  const openCreate = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };

  const handleOpenDetail = (r: Report) => {
    setSelectedReport(r);
    setDrawerOpen(true);
  };

  const handleDelete = (r: Report, mode: "permanent" | "soft" = "permanent") => {
    if (!user) return;
    if (mode === "permanent") {
      reportRepo.remove(r.id);
      toast.success("Setoran dihapus permanen (clear database).");
    } else {
      softDeleteReport(r.id, user.id);
      toast.success("Setoran diarsipkan.");
    }
    if (selectedReport?.id === r.id) {
      setDrawerOpen(false);
      setSelectedReport(null);
    }
  };

  const handleToggle = (r: Report) => {
    if (!user) return;
    const updated = toggleHomework(r.id, user.id);
    if (updated && selectedReport?.id === r.id) {
      setSelectedReport(updated);
    }
  };

  const renderContent = (rows: Report[], canEdit: boolean, empty: string) => {
    if (!ready || !sessionReady) {
      return (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      );
    }
    if (rows.length === 0) {
      return (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {empty}
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
          onEdit={(rep) => {
            setEditing(rep);
            setDialogOpen(true);
          }}
          onDelete={handleDelete}
          onToggleHomework={handleToggle}
        />
      );
    }

    return (
      <div className="grid gap-3 md:grid-cols-2 animate-fade-up">
        {rows.map((r) => (
          <ReportCard
            key={r.id}
            report={r}
            teachers={teachers}
            canEdit={canEdit}
            onSelect={handleOpenDetail}
            onEdit={(rep) => {
              setEditing(rep);
              setDialogOpen(true);
            }}
            onDelete={handleDelete}
            {...(r.homework && (canEdit || r.teacherId === user?.id)
              ? { onToggleHomework: handleToggle }
              : {})}
          />
        ))}
      </div>
    );
  };

  return (
    <AppShell>
      <PageHeader
        title="Setoran"
        description="Catat setoran guru lain sebagai Mustami' dan pantau progres upgrading Anda."
        action={
          user ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  exportReportsCSV(reportRows, teacherRows);
                  toast.success("Laporan setoran berhasil diunduh (CSV).");
                }}
                className="gap-1.5 shadow-xs text-xs h-9"
              >
                <Download className="size-3.5" />
                <span>Ekspor CSV</span>
              </Button>
              <Button onClick={openCreate} className="shadow-xs gap-1.5 text-xs h-9">
                <Plus className="size-4" /> Setoran Baru
              </Button>
            </div>
          ) : null
        }
      />

      <div className="mb-4 grid gap-2 sm:grid-cols-2 md:grid-cols-5 bg-card p-3 rounded-xl border border-border">
        <Input
          placeholder="Cari guru, materi, atau ayat..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="text-xs h-9 sm:col-span-2"
        />
        <Select value={material} onValueChange={setMaterial}>
          <SelectTrigger className="h-9 text-xs">
            <div className="flex items-center gap-1.5 truncate">
              <Filter className="size-3 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Semua Materi" />
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

        <Select value={gradeFilter} onValueChange={setGradeFilter}>
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Semua Nilai" />
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

        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="h-9 text-xs flex-1">
              <div className="flex items-center gap-1.5 truncate">
                <ArrowUpDown className="size-3 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Urutan" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Terbaru</SelectItem>
              <SelectItem value="date-asc">Terlama</SelectItem>
              <SelectItem value="grade-desc">Nilai A → D</SelectItem>
              <SelectItem value="grade-asc">Nilai D → A</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Switcher Toggle */}
          <div className="flex items-center rounded-lg border border-border bg-muted/40 p-1 shrink-0">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => changeViewMode("grid")}
              className="h-7 px-2 text-xs font-medium"
            >
              <LayoutGrid className="size-3.5" />
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => changeViewMode("table")}
              className="h-7 px-2 text-xs font-medium"
            >
              <TableIcon className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="progress">
        <TabsList className="w-full overflow-x-auto sm:w-auto">
          <TabsTrigger value="progress">My Upgrading Progress</TabsTrigger>
          <TabsTrigger value="assessment">My Assessment Activity</TabsTrigger>
          {isUpgrader && <TabsTrigger value="all">Semua Setoran</TabsTrigger>}
        </TabsList>
        <TabsContent value="progress" className="mt-4">
          {renderContent(myProgress, false, "Belum ada setoran yang disimak oleh guru lain.")}
        </TabsContent>
        <TabsContent value="assessment" className="mt-4">
          {renderContent(myAssessments, true, "Anda belum mencatat setoran sebagai Mustami'.")}
        </TabsContent>
        {isUpgrader && (
          <TabsContent value="all" className="mt-4">
            {renderContent(allReports, true, "Belum ada setoran tercatat.")}
          </TabsContent>
        )}
      </Tabs>

      {user && (
        <ReportFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          currentUser={user}
          teachers={teachers}
          reports={reportRows}
          editing={editing}
        />
      )}

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
        onEdit={(rep) => {
          setEditing(rep);
          setDialogOpen(true);
        }}
        onDelete={handleDelete}
        onToggleHomework={handleToggle}
      />
    </AppShell>
  );
}
