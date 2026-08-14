import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Download,
  FileSpreadsheet,
  HardDrive,
  Info,
  Megaphone,
  Pencil,
  Pin,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { AnnouncementDialog } from "@/components/announcements/AnnouncementDialog";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollection } from "@/hooks/use-repository";
import { useSession } from "@/hooks/use-session";
import {
  allRepos,
  announcementRepo,
  reportRepo,
  targetRepo,
  teacherRepo,
} from "@/lib/data/repositories";
import { formatDate } from "@/lib/data/selectors";
import { SCHEMA_VERSION } from "@/lib/data/storage";
import type { Announcement } from "@/lib/data/types";
import {
  deleteAnnouncement,
  listAnnouncements,
  togglePinAnnouncement,
} from "@/lib/services/announcement-service";
import {
  exportFullDatabaseJSON,
  importFullDatabaseJSON,
  resetDatabaseToDemo,
} from "@/lib/services/backup-service";
import {
  exportReportsCSV,
  exportTargetsCSV,
  exportTeachersCSV,
} from "@/lib/services/reporting-export-service";
import { listTeachers } from "@/lib/services/teacher-service";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Pengaturan & Backup | Griya Huffazh Quran" },
      { name: "description", content: "Pengumuman, ekspor laporan, cadangan data, dan sistem." },
      { property: "og:title", content: "Pengaturan & Backup | Griya Huffazh Quran" },
      { property: "og:description", content: "Pengumuman, ekspor laporan, cadangan data, dan sistem." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { rows: announcements, ready: annReady } = useCollection(announcementRepo);
  const { rows: reportRows } = useCollection(reportRepo);
  const { rows: targetRows } = useCollection(targetRepo);
  const { rows: teacherRows } = useCollection(teacherRepo);
  const { user, isUpgrader, role } = useSession();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState<Announcement | undefined>(undefined);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const teachers = listTeachers(teacherRows);
  const annList = listAnnouncements(announcements, role);

  const handleCreateAnn = () => {
    setEditingAnn(undefined);
    setDialogOpen(true);
  };

  const handleEditAnn = (ann: Announcement) => {
    setEditingAnn(ann);
    setDialogOpen(true);
  };

  const handleDeleteAnn = (ann: Announcement) => {
    deleteAnnouncement(ann.id, user?.id);
    toast.success("Pengumuman berhasil dihapus.");
  };

  const handleTogglePin = (ann: Announcement) => {
    togglePinAnnouncement(ann.id);
    toast.success(ann.pinned ? "Pengumuman dilepas dari pin." : "Pengumuman disematkan di atas.");
  };

  // Import JSON backup handler
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importFullDatabaseJSON(content);
        if (res.ok) {
          toast.success("Data berhasil dipulihkan dari berkas cadangan JSON!");
        } else {
          toast.error(res.error);
        }
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = "";
  };

  return (
    <AppShell>
      <PageHeader
        title="Pengaturan & Layanan Data"
        description="Kelola pengumuman lembaga, ekspor laporan CSV, cadangan data JSON, dan pengaturan sistem."
      />

      <Tabs defaultValue="announcements" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="announcements" className="text-xs font-semibold gap-1.5">
            <Megaphone className="size-3.5" /> Pengumuman
          </TabsTrigger>
          <TabsTrigger value="export" className="text-xs font-semibold gap-1.5">
            <FileSpreadsheet className="size-3.5" /> Ekspor & Laporan
          </TabsTrigger>
          <TabsTrigger value="backup" className="text-xs font-semibold gap-1.5">
            <HardDrive className="size-3.5" /> Cadangan & Pemulihan
          </TabsTrigger>
          <TabsTrigger value="system" className="text-xs font-semibold gap-1.5">
            <Info className="size-3.5" /> Sistem
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PENGUMUMAN LEMBAGA */}
        <TabsContent value="announcements" className="mt-4 space-y-4">
          <div className="flex items-center justify-between bg-card p-3 rounded-xl border border-border">
            <span className="text-xs font-semibold text-muted-foreground">
              Daftar Pengumuman Resmi Lembaga ({annList.length})
            </span>
            {user && (isUpgrader || role === "upgrader") && (
              <Button size="sm" onClick={handleCreateAnn} className="h-8 text-xs font-medium gap-1">
                <Plus className="size-3.5" /> Buat Pengumuman
              </Button>
            )}
          </div>

          {!annReady ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ) : annList.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-xs text-muted-foreground">
                <Megaphone className="mx-auto size-8 text-muted-foreground/40 mb-2" />
                <p className="font-semibold text-sm text-foreground">Belum Ada Pengumuman</p>
                <p className="mt-1">Terbitkan pengumuman baru untuk menyampaikan informasi ke seluruh guru.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 animate-fade-up">
              {annList.map((ann) => (
                <Card key={ann.id} className={ann.pinned ? "border-primary/40 bg-primary/5" : "bg-card"}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {ann.pinned && (
                            <Badge variant="default" className="text-[10px] gap-1 font-semibold">
                              <Pin className="size-3" /> Disematkan
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[10px] capitalize">
                            Penerima: {ann.audience}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            {formatDate(ann.createdAt)} • Diterbitkan oleh {ann.authorName}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-foreground">{ann.title}</h4>
                      </div>

                      {user && (isUpgrader || role === "upgrader") && (
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-muted-foreground hover:text-primary"
                            onClick={() => handleTogglePin(ann)}
                            title={ann.pinned ? "Lepas Pin" : "Sematkan di Atas"}
                          >
                            <Pin className="size-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-muted-foreground hover:text-foreground"
                            onClick={() => handleEditAnn(ann)}
                            title="Edit Pengumuman"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteAnn(ann)}
                            title="Hapus Pengumuman"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                      {ann.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: EKSPOR & LAPORAN */}
        <TabsContent value="export" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-4 space-y-3">
              <div className="size-9 grid place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <FileSpreadsheet className="size-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">Ekspor Setoran (CSV)</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Unduh seluruh data riwayat setoran guru beserta nilai dan catatan PR dalam format CSV.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-medium gap-1.5"
                onClick={() => {
                  exportReportsCSV(reportRows, teachers);
                  toast.success("Unduhan CSV setoran dimulai.");
                }}
              >
                <Download className="size-3.5" /> Unduh Setoran CSV
              </Button>
            </Card>

            <Card className="p-4 space-y-3">
              <div className="size-9 grid place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <FileSpreadsheet className="size-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">Ekspor Target Upgrading (CSV)</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Unduh data target upgrading guru, capaian nilai, dan status tenggat dalam format CSV.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-medium gap-1.5"
                onClick={() => {
                  exportTargetsCSV(targetRows, teachers);
                  toast.success("Unduhan CSV target dimulai.");
                }}
              >
                <Download className="size-3.5" /> Unduh Target CSV
              </Button>
            </Card>

            <Card className="p-4 space-y-3">
              <div className="size-9 grid place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <FileSpreadsheet className="size-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">Ekspor Master Data Guru (CSV)</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Unduh data pengajar, jabatan, spesialisasi, dan status keanggotaan dalam format CSV.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-medium gap-1.5"
                onClick={() => {
                  exportTeachersCSV(teachers);
                  toast.success("Unduhan CSV data guru dimulai.");
                }}
              >
                <Download className="size-3.5" /> Unduh Data Guru CSV
              </Button>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 3: CADANGAN & PEMULIHAN */}
        <TabsContent value="backup" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Export Backup JSON */}
            <Card className="p-4 space-y-3">
              <div className="size-9 grid place-items-center rounded-xl bg-primary/10 text-primary">
                <HardDrive className="size-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">Cadangkan Data (Export JSON)</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Simpan seluruh snapshot database (Setoran, Target, Pengumuman, Notifikasi) ke dalam satu berkas `.json`.
                </p>
              </div>
              <Button
                onClick={() => {
                  exportFullDatabaseJSON();
                  toast.success("Berkas cadangan JSON berhasil diunduh.");
                }}
                className="w-full text-xs font-medium gap-1.5"
              >
                <Download className="size-3.5" /> Unduh Cadangan Data (JSON)
              </Button>
            </Card>

            {/* Import Backup JSON */}
            <Card className="p-4 space-y-3">
              <div className="size-9 grid place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Upload className="size-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">Pulihkan Data (Import JSON)</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Unggah berkas cadangan `.json` untuk memulihkan seluruh data aplikasi ke perangkat ini.
                </p>
              </div>
              <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                onChange={handleFileImport}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full text-xs font-medium gap-1.5"
              >
                <Upload className="size-3.5" /> Unggah Berkas JSON
              </Button>
            </Card>
          </div>

          {/* Reset Demo Data Card */}
          <Card className="border-destructive/30 bg-destructive/5 p-4 space-y-3">
            <div className="flex items-center gap-2 text-destructive font-bold text-sm">
              <ShieldAlert className="size-4" /> Reset Data Ke Contoh Awal
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tindakan ini akan menghapus data yang Anda ubah dan mengembalikan seluruh repositori ke data demo bawaan Griya Huffazh Quran.
            </p>

            <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="text-xs font-medium gap-1.5">
                  <RotateCcw className="size-3.5" /> Reset Data Demo
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Konfirmasi Reset Data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Seluruh data setoran, target, pengumuman, dan notifikasi lokal akan dikembalikan ke data contoh bawaan sistem.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      resetDatabaseToDemo();
                      setResetDialogOpen(false);
                      toast.success("Data berhasil di-reset ke data demo bawaan.");
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Ya, Reset Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Card>
        </TabsContent>

        {/* TAB 4: SISTEM */}
        <TabsContent value="system" className="mt-4">
          <Card className="border-border p-4 space-y-4">
            <CardHeader className="p-0">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Info className="size-4 text-primary" /> Informasi Skema & Aplikasi
              </CardTitle>
              <CardDescription className="text-xs">
                Aplikasi Manajemen Upgrading Guru — Griya Huffazh Quran
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl border border-border bg-muted/40">
                <div>
                  <span className="text-muted-foreground">Versi Skema Data:</span>
                  <p className="font-bold text-foreground">v{SCHEMA_VERSION}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Repositori:</span>
                  <p className="font-bold text-foreground">{allRepos.length} Koleksi Data</p>
                </div>
              </div>
              <div>
                <span className="font-semibold text-foreground">Daftar Repositori Terdaftar:</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {allRepos.map((r) => (
                    <Badge key={r.name} variant="outline" className="text-[10px]">
                      {r.name} ({r.list().length} item)
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Form Announcement */}
      {user && (
        <AnnouncementDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          currentUser={user}
          editing={editingAnn}
        />
      )}
    </AppShell>
  );
}
