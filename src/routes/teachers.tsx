import { createFileRoute } from "@tanstack/react-router";
import { Download, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { exportTeachersCSV } from "@/lib/services/reporting-export-service";
import { TeacherDetailSheet } from "@/components/teachers/TeacherDetailSheet";
import { TeacherFormDialog } from "@/components/teachers/TeacherFormDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCollection } from "@/hooks/use-repository";
import { reportRepo, teacherRepo } from "@/lib/data/repositories";
import { averageScore, formatDate } from "@/lib/data/selectors";
import type { Teacher } from "@/lib/data/types";
import { initials, listTeachers, setTeacherStatus } from "@/lib/services/teacher-service";

export const Route = createFileRoute("/teachers")({
  head: () => ({
    meta: [
      { title: "Guru | Griya Huffazh Quran" },
      { name: "description", content: "Master data guru, ustadz, dan ustadzah." },
      { property: "og:title", content: "Guru | Griya Huffazh Quran" },
      { property: "og:description", content: "Master data guru, ustadz, dan ustadzah." },
    ],
  }),
  component: Page,
});

type SortKey = "name" | "joinedAt" | "reports";

function Page() {
  const { rows, ready } = useCollection(teacherRepo);
  const { rows: reports } = useCollection(reportRepo);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("semua");
  const [role, setRole] = useState<string>("semua");
  const [sort, setSort] = useState<SortKey>("name");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [detail, setDetail] = useState<Teacher | null>(null);

  const teachers = useMemo(() => listTeachers(rows), [rows]);

  const countFor = (id: string) => reports.filter((r) => r.teacherId === id).length;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = teachers.filter((t) => {
      const matchQ =
        !q ||
        t.name.toLowerCase().includes(q) ||
        (t.username ?? "").toLowerCase().includes(q) ||
        (t.position ?? "").toLowerCase().includes(q) ||
        (t.specialization ?? "").toLowerCase().includes(q);
      const matchStatus = status === "semua" || t.status === status;
      const matchRole = role === "semua" || (t.role ?? "teacher") === role;
      return matchQ && matchStatus && matchRole;
    });
    return [...filtered].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "joinedAt") return b.joinedAt.localeCompare(a.joinedAt);
      return countFor(b.id) - countFor(a.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teachers, reports, query, status, role, sort]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (t: Teacher) => {
    setDetail(null);
    setEditing(t);
    setFormOpen(true);
  };
  const toggleStatus = (t: Teacher) => {
    const next = t.status === "aktif" ? "nonaktif" : "aktif";
    setTeacherStatus(t.id, next);
    toast.success(next === "aktif" ? "Guru diaktifkan kembali." : "Guru dinonaktifkan.");
  };

  const [deleteTeacherTarget, setDeleteTeacherTarget] = useState<Teacher | null>(null);

  const handleDeleteTeacher = (t: Teacher) => {
    setDeleteTeacherTarget(t);
  };

  const confirmDeleteTeacher = () => {
    if (!deleteTeacherTarget) return;
    teacherRepo.remove(deleteTeacherTarget.id);
    toast.success(`Data guru ${deleteTeacherTarget.name} berhasil dihapus.`);
    setDeleteTeacherTarget(null);
    if (detail?.id === deleteTeacherTarget.id) setDetail(null);
  };

  return (
    <AppShell>
      <PageHeader
        title="Data Guru"
        description="Master data guru, ustadz, dan ustadzah."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                exportTeachersCSV(teachers);
                toast.success("Master data guru berhasil diunduh (CSV).");
              }}
              className="gap-1.5 shadow-xs text-xs h-9"
            >
              <Download className="size-3.5" />
              <span>Ekspor CSV</span>
            </Button>
            <Button onClick={openCreate} className="gap-1.5 shadow-xs text-xs h-9">
              <Plus className="size-4" /> Tambah Guru
            </Button>
          </div>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2 lg:col-span-2">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Cari nama, username, jabatan..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua status</SelectItem>
            <SelectItem value="aktif">Aktif</SelectItem>
            <SelectItem value="nonaktif">Nonaktif</SelectItem>
          </SelectContent>
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger>
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua role</SelectItem>
              <SelectItem value="teacher">Teacher</SelectItem>
              <SelectItem value="upgrader">Upgrader</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger>
              <SelectValue placeholder="Urutkan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nama A-Z</SelectItem>
              <SelectItem value="joinedAt">Terbaru bergabung</SelectItem>
              <SelectItem value="reports">Setoran terbanyak</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!ready ? (
        <Card>
          <CardContent className="space-y-2 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            Tidak ada guru yang cocok dengan filter.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Jabatan</TableHead>
                    <TableHead>Spesialisasi</TableHead>
                    <TableHead className="hidden lg:table-cell">Bergabung</TableHead>
                    <TableHead className="text-right">Setoran</TableHead>
                    <TableHead className="text-right">Rata-rata</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((t) => {
                    const own = reports.filter((r) => r.teacherId === t.id);
                    return (
                      <TableRow key={t.id} className="cursor-pointer" onClick={() => setDetail(t)}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="size-9">
                              {t.photoUrl && <AvatarImage src={t.photoUrl} alt={t.name} />}
                              <AvatarFallback>{initials(t.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{t.name}</p>
                              <p className="text-xs text-muted-foreground">
                                @{t.username} • {t.role === "upgrader" ? "Upgrader" : "Teacher"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{t.position}</TableCell>
                        <TableCell>{t.specialization}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {formatDate(t.joinedAt)}
                        </TableCell>
                        <TableCell className="text-right">{own.length}</TableCell>
                        <TableCell className="text-right">{averageScore(own) ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={t.status === "aktif" ? "default" : "secondary"}>
                            {t.status === "aktif" ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <RowMenu
                            t={t}
                            onEdit={openEdit}
                            onToggle={toggleStatus}
                            onDetail={setDetail}
                            onDelete={handleDeleteTeacher}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Mobile */}
          <div className="grid gap-3 md:hidden">
            {visible.map((t) => (
              <Card key={t.id} onClick={() => setDetail(t)}>
                <CardContent className="flex items-start gap-3 p-4">
                  <Avatar className="size-10">
                    {t.photoUrl && <AvatarImage src={t.photoUrl} alt={t.name} />}
                    <AvatarFallback>{initials(t.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{t.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      @{t.username} • {t.position}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant={t.status === "aktif" ? "default" : "secondary"}>
                        {t.status === "aktif" ? "Aktif" : "Nonaktif"}
                      </Badge>
                      <span>{t.specialization}</span>
                      <span>• {reports.filter((r) => r.teacherId === t.id).length} setoran</span>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <RowMenu
                      t={t}
                      onEdit={openEdit}
                      onToggle={toggleStatus}
                      onDetail={setDetail}
                      onDelete={handleDeleteTeacher}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <TeacherFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        teacher={editing}
        teachers={teachers}
      />
      <TeacherDetailSheet
        teacher={detail}
        reports={reports}
        onOpenChange={(v) => !v && setDetail(null)}
        onEdit={openEdit}
        onDelete={handleDeleteTeacher}
      />

      <ConfirmDeleteDialog
        open={!!deleteTeacherTarget}
        onOpenChange={(open) => !open && setDeleteTeacherTarget(null)}
        title="Hapus Data Guru"
        itemName={deleteTeacherTarget?.name}
        onConfirm={(mode) => {
          if (!deleteTeacherTarget) return;
          if (mode === "permanent") {
            teacherRepo.remove(deleteTeacherTarget.id);
            toast.success(`Data guru ${deleteTeacherTarget.name} dihapus permanen (clear database).`);
          } else {
            setTeacherStatus(deleteTeacherTarget.id, "nonaktif");
            toast.success(`Data guru ${deleteTeacherTarget.name} dinonaktifkan/diarsipkan.`);
          }
          setDeleteTeacherTarget(null);
          if (detail?.id === deleteTeacherTarget.id) setDetail(null);
        }}
      />
    </AppShell>
  );
}

function RowMenu({
  t,
  onEdit,
  onToggle,
  onDetail,
  onDelete,
}: {
  t: Teacher;
  onEdit: (t: Teacher) => void;
  onToggle: (t: Teacher) => void;
  onDetail: (t: Teacher) => void;
  onDelete: (t: Teacher) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Aksi untuk ${t.name}`}>
          ⋯
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onDetail(t)}>Lihat detail</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(t)}>Edit</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onToggle(t)}>
          {t.status === "aktif" ? "Nonaktifkan" : "Aktifkan"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDelete(t)} className="text-destructive font-medium">
          Hapus Guru
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
