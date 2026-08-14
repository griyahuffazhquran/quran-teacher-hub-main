import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { LayoutGrid, Plus, Table as TableIcon } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ReportCard } from "@/components/reports/ReportCard";
import { ReportTable } from "@/components/reports/ReportTable";
import { ReportFormDialog } from "@/components/reports/ReportFormDialog";
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
import { activeReports, materialOptions, sortByDateDesc } from "@/lib/data/selectors";
import type { Report } from "@/lib/data/types";
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

function Page() {
  const { rows: reportRows, ready } = useCollection(reportRepo);
  const { rows: teacherRows } = useCollection(teacherRepo);
  const { user, isUpgrader, ready: sessionReady } = useSession();

  const teachers = useMemo(() => listTeachers(teacherRows), [teacherRows]);
  const reports = useMemo(() => activeReports(reportRows), [reportRows]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Report | undefined>(undefined);
  const [query, setQuery] = useState("");
  const [material, setMaterial] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("setoran_view_mode") as "grid" | "table") || "grid";
    }
    return "grid";
  });

  const changeViewMode = (mode: "grid" | "table") => {
    setViewMode(mode);
    localStorage.setItem("setoran_view_mode", mode);
  };

  const filter = (rows: Report[]) => {
    const q = query.trim().toLowerCase();
    return sortByDateDesc(
      rows.filter((r) => {
        if (material !== "all" && r.material !== material) return false;
        if (!q) return true;
        const name = teachers.find((t) => t.id === r.teacherId)?.name ?? "";
        return [name, r.materialDetail, r.reference, r.mustamiName]
          .join(" ")
          .toLowerCase()
          .includes(q);
      }),
    );
  };

  const myProgress = user ? filter(progressOf(reports, user.id)) : [];
  const myAssessments = user ? filter(assessmentsOf(reports, user.id)) : [];
  const allReports = filter(reports);

  const openCreate = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };

  const handleDelete = (r: Report) => {
    if (!user) return;
    softDeleteReport(r.id, user.id);
    toast.success("Setoran dihapus.");
  };

  const handleToggle = (r: Report) => {
    if (!user) return;
    toggleHomework(r.id, user.id);
  };

  const renderContent = (rows: Report[], canEdit: boolean, empty: string) => {
    if (!ready || !sessionReady) {
      return (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
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
        actions={
          user ? (
            <Button onClick={openCreate} className="shadow-sm">
              <Plus className="mr-1 size-4" /> Setoran Baru
            </Button>
          ) : null
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder="Cari guru, materi, atau ayat..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="sm:max-w-xs"
          />
          <Select value={material} onValueChange={setMaterial}>
            <SelectTrigger className="sm:w-52">
              <SelectValue />
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
        </div>

        {/* View Mode Switcher Toggle */}
        <div className="flex items-center rounded-lg border border-border bg-muted/40 p-1 self-start sm:self-auto">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => changeViewMode("grid")}
            className="h-8 px-2.5 text-xs font-medium gap-1.5"
          >
            <LayoutGrid className="size-3.5" />
            <span>Kartu</span>
          </Button>
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => changeViewMode("table")}
            className="h-8 px-2.5 text-xs font-medium gap-1.5"
          >
            <TableIcon className="size-3.5" />
            <span>Tabel</span>
          </Button>
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
    </AppShell>
  );
}
