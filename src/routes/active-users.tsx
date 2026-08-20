import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  CheckCircle2,
  Clock,
  Filter,
  Globe,
  Laptop,
  LayoutGrid,
  Radio,
  RefreshCw,
  Search,
  Shield,
  Smartphone,
  Table as TableIcon,
  UserCheck,
  UserX,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCollection } from "@/hooks/use-repository";
import { usePresenceList } from "@/hooks/use-presence";
import { useSession } from "@/hooks/use-session";
import { teacherRepo } from "@/lib/data/repositories";
import { initials } from "@/lib/services/teacher-service";
import type { Teacher } from "@/lib/data/types";
import type { UserPresenceRecord } from "@/lib/services/presence-service";

export const Route = createFileRoute("/active-users")({
  head: () => ({
    meta: [
      { title: "User Online | Griya Huffazh Quran" },
      {
        name: "description",
        content: "Monitoring real-time user & pengajar yang sedang aktif online di aplikasi.",
      },
      { property: "og:title", content: "User Online | Griya Huffazh Quran" },
      {
        property: "og:description",
        content: "Monitoring real-time user & pengajar yang sedang aktif online di aplikasi.",
      },
    ],
  }),
  component: ActiveUsersPage,
});

function formatRelativeTime(timestamp: number, now: number): string {
  const diffSec = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (diffSec < 5) return "Baru saja";
  if (diffSec < 60) return `${diffSec} detik lalu`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHour = Math.floor(diffMin / 60);
  return `${diffHour} jam lalu`;
}

function getPageName(path: string): string {
  if (path === "/") return "Dashboard";
  if (path.startsWith("/reports")) return "Setoran";
  if (path.startsWith("/targets")) return "Target";
  if (path.startsWith("/achievements")) return "Leaderboard & Lencana";
  if (path.startsWith("/announcements")) return "Pengumuman";
  if (path.startsWith("/teachers")) return "Guru";
  if (path.startsWith("/analytics")) return "Analitik";
  if (path.startsWith("/notifications")) return "Notifikasi";
  if (path.startsWith("/profile")) return "Profil";
  if (path.startsWith("/settings")) return "Pengaturan";
  if (path.startsWith("/active-users")) return "User Online";
  return path;
}

function ActiveUsersPage() {
  const { user, isUpgrader, ready } = useSession();
  const { rows: teacherRows } = useCollection(teacherRepo);
  const { presenceMap, now, evaluatePresenceStatus } = usePresenceList();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");

  // All non-deleted active teachers
  const allTeachers = useMemo(() => {
    return teacherRows.filter((t) => !t.isDeleted);
  }, [teacherRows]);

  // Combined list of teachers with presence data
  const combinedList = useMemo(() => {
    return allTeachers.map((teacher) => {
      const presence: UserPresenceRecord | undefined = presenceMap[teacher.id];
      const presenceInfo = evaluatePresenceStatus(presence);
      return {
        teacher,
        presence,
        presenceInfo,
      };
    });
  }, [allTeachers, presenceMap, now]);

  // Statistics
  const onlineCount = useMemo(
    () => combinedList.filter((item) => item.presenceInfo.isOnline).length,
    [combinedList],
  );

  const idleCount = useMemo(
    () => combinedList.filter((item) => item.presenceInfo.isIdle).length,
    [combinedList],
  );

  const offlineCount = useMemo(
    () => combinedList.filter((item) => item.presenceInfo.isOffline).length,
    [combinedList],
  );

  // Filtered List
  const filteredList = useMemo(() => {
    return combinedList.filter(({ teacher, presenceInfo }) => {
      // Role filter
      if (roleFilter !== "all" && (teacher.role ?? "teacher") !== roleFilter) return false;

      // Status filter
      if (statusFilter === "online" && !presenceInfo.isOnline) return false;
      if (statusFilter === "idle" && !presenceInfo.isIdle) return false;
      if (statusFilter === "offline" && !presenceInfo.isOffline) return false;

      // Query search
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        teacher.name.toLowerCase().includes(q) ||
        (teacher.username || "").toLowerCase().includes(q) ||
        (teacher.position || "").toLowerCase().includes(q)
      );
    });
  }, [combinedList, query, statusFilter, roleFilter]);

  if (ready && !isUpgrader) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-6 space-y-4">
          <div className="grid size-16 place-items-center rounded-2xl bg-destructive/10 text-destructive">
            <Shield className="size-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Akses Terbatas</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Halaman Monitoring User Online hanya dapat diakses oleh akun berkewenangan <strong>Upgrader / Pengurus</strong>.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Pengawasan User Online"
        description="Monitoring real-time user dan pengajar yang sedang aktif membuka aplikasi."
        action={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="h-9 px-3 gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex size-2.5 rounded-full bg-emerald-600"></span>
              </span>
              <span className="text-xs font-semibold">Live Real-Time Pulse</span>
            </Badge>
          </div>
        }
      />

      {/* Overview Stats Bar */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-6">
        {/* Card 1: Online */}
        <Card className="relative overflow-hidden border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 transition-all hover:shadow-md">
          <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
              Online Aktif Sekarang
            </CardTitle>
            <Radio className="size-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
          </CardHeader>
          <CardContent className="p-3.5 pt-1">
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 tracking-tight">
                {onlineCount}
              </p>
              <span className="text-xs text-emerald-600/80 font-medium">User Aktif</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 truncate">
              Membuka & berinteraksi di aplikasi
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Idle */}
        <Card className="relative overflow-hidden border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20 transition-all hover:shadow-md">
          <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-amber-700 dark:text-amber-400">
              Idle / Background
            </CardTitle>
            <Clock className="size-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent className="p-3.5 pt-1">
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 tracking-tight">
                {idleCount}
              </p>
              <span className="text-xs text-amber-600/80 font-medium">User</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 truncate">
              Tab diminimalkan / tidak fokus
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Offline */}
        <Card className="relative overflow-hidden border-border transition-all hover:shadow-md">
          <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Offline / Tidak Aktif
            </CardTitle>
            <UserX className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3.5 pt-1">
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-foreground tracking-tight">
                {offlineCount}
              </p>
              <span className="text-xs text-muted-foreground font-medium">User</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 truncate">
              Tidak membuka aplikasi saat ini
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Total */}
        <Card className="relative overflow-hidden border-border transition-all hover:shadow-md">
          <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Total Pengajar Lembaga
            </CardTitle>
            <UserCheck className="size-4 text-primary" />
          </CardHeader>
          <CardContent className="p-3.5 pt-1">
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-foreground tracking-tight">
                {allTeachers.length}
              </p>
              <span className="text-xs text-muted-foreground font-medium">Akun</span>
            </div>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 truncate">
              {allTeachers.length > 0
                ? `${Math.round((onlineCount / allTeachers.length) * 100)}% Keaktifan Saat Ini`
                : "0%"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Control Toolbar */}
      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-5 bg-card p-3 rounded-xl border border-border mb-4">
        {/* Search */}
        <div className="relative sm:col-span-2">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama guru, username, jabatan..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 text-xs h-9"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 text-xs">
            <div className="flex items-center gap-1.5 truncate">
              <Filter className="size-3 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Status Online" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="online">🟢 Online Aktif ({onlineCount})</SelectItem>
            <SelectItem value="idle">🟡 Idle ({idleCount})</SelectItem>
            <SelectItem value="offline">⚪ Offline ({offlineCount})</SelectItem>
          </SelectContent>
        </Select>

        {/* Role Filter */}
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Semua Peran" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Peran</SelectItem>
            <SelectItem value="upgrader">Upgrader / Admin</SelectItem>
            <SelectItem value="teacher">Guru Pengajar</SelectItem>
          </SelectContent>
        </Select>

        {/* View Switcher */}
        <div className="flex items-center rounded-lg border border-border bg-muted/40 p-1 justify-end">
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
            className="h-7 px-2.5 text-xs font-medium gap-1.5 flex-1 sm:flex-initial"
          >
            <TableIcon className="size-3.5" />
            <span>Tabel</span>
          </Button>
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="h-7 px-2.5 text-xs font-medium gap-1.5 flex-1 sm:flex-initial"
          >
            <LayoutGrid className="size-3.5" />
            <span>Kartu</span>
          </Button>
        </div>
      </div>

      {/* Main Content Section */}
      {filteredList.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-xs text-muted-foreground">
            <UserX className="mx-auto size-8 text-muted-foreground/50 mb-2" />
            <span>Tidak ditemukan user dengan kriteria filter yang dipilih.</span>
          </CardContent>
        </Card>
      ) : viewMode === "table" ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm animate-zoom-in">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold">Pengajar / User</TableHead>
                <TableHead className="font-bold">Peran & Posisi</TableHead>
                <TableHead className="font-bold">Status Keaktifan</TableHead>
                <TableHead className="font-bold">Halaman Sedang Dibuka</TableHead>
                <TableHead className="font-bold">Peranti / Browser</TableHead>
                <TableHead className="text-right font-bold">Terakhir Aktif</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredList.map(({ teacher, presence, presenceInfo }) => {
                const isCurrentSelf = teacher.id === user?.id;

                return (
                  <TableRow key={teacher.id} className="transition-colors hover:bg-accent/30">
                    {/* User */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="size-9 border border-border">
                            {teacher.photoUrl && <AvatarImage src={teacher.photoUrl} alt={teacher.name} />}
                            <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                              {initials(teacher.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-background ${
                              presenceInfo.isOnline
                                ? "bg-emerald-500 animate-pulse"
                                : presenceInfo.isIdle
                                ? "bg-amber-500"
                                : "bg-zinc-400"
                            }`}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                            {teacher.name}
                            {isCurrentSelf && (
                              <Badge variant="outline" className="text-[9px] px-1 py-0 bg-primary/10 text-primary border-primary/20">
                                Anda
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            @{teacher.username || "guru"}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Role & Position */}
                    <TableCell>
                      <div className="space-y-0.5">
                        <Badge
                          variant={teacher.role === "upgrader" ? "default" : "secondary"}
                          className="text-[10px] font-bold"
                        >
                          {teacher.role === "upgrader" ? "Upgrader" : "Guru"}
                        </Badge>
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {teacher.position || (teacher.gender === "ustadz" ? "Ustadz" : "Ustadzah")}
                        </p>
                      </div>
                    </TableCell>

                    {/* Presence Status Badge */}
                    <TableCell>
                      {presenceInfo.isOnline ? (
                        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 px-2.5 py-0.5 shadow-xs">
                          <span className="relative flex size-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex size-2 rounded-full bg-white"></span>
                          </span>
                          <span>Online Aktif</span>
                        </Badge>
                      ) : presenceInfo.isIdle ? (
                        <Badge variant="secondary" className="bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold text-xs gap-1.5 border border-amber-500/30">
                          <Clock className="size-3 text-amber-600" />
                          <span>Idle (Background)</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground gap-1.5">
                          <span className="size-2 rounded-full bg-zinc-400" />
                          <span>Offline</span>
                        </Badge>
                      )}
                    </TableCell>

                    {/* Current Page */}
                    <TableCell>
                      {presence ? (
                        <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                          <Globe className="size-3.5 text-primary shrink-0" />
                          <span className="truncate max-w-[160px]">{getPageName(presence.currentPath)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/60">—</span>
                      )}
                    </TableCell>

                    {/* Device / Browser */}
                    <TableCell>
                      {presence ? (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          {presence.deviceInfo.includes("HP") || presence.deviceInfo.includes("Mobile") ? (
                            <Smartphone className="size-3.5 text-indigo-500 shrink-0" />
                          ) : (
                            <Laptop className="size-3.5 text-blue-500 shrink-0" />
                          )}
                          <span className="truncate max-w-[160px]">{presence.deviceInfo}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/60">—</span>
                      )}
                    </TableCell>

                    {/* Last Seen relative */}
                    <TableCell className="text-right text-xs font-mono text-muted-foreground whitespace-nowrap">
                      {presence ? formatRelativeTime(presence.lastSeenAt, now) : "Tidak Aktif"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        /* Grid Card View */
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 animate-fade-up">
          {filteredList.map(({ teacher, presence, presenceInfo }) => {
            const isCurrentSelf = teacher.id === user?.id;

            return (
              <Card
                key={teacher.id}
                className={`transition-all hover:shadow-md ${
                  presenceInfo.isOnline
                    ? "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/10"
                    : presenceInfo.isIdle
                    ? "border-amber-500/40 bg-amber-500/5 dark:bg-amber-950/10"
                    : "border-border opacity-80"
                }`}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <Avatar className="size-10 border border-border">
                          {teacher.photoUrl && <AvatarImage src={teacher.photoUrl} alt={teacher.name} />}
                          <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                            {initials(teacher.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-background ${
                            presenceInfo.isOnline
                              ? "bg-emerald-500 animate-pulse"
                              : presenceInfo.isIdle
                              ? "bg-amber-500"
                              : "bg-zinc-400"
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-foreground text-sm truncate flex items-center gap-1.5">
                          {teacher.name}
                          {isCurrentSelf && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 bg-primary/10 text-primary">
                              Anda
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {teacher.position || `@${teacher.username}`}
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant={teacher.role === "upgrader" ? "default" : "secondary"}
                      className="text-[10px] shrink-0 font-semibold"
                    >
                      {teacher.role === "upgrader" ? "Upgrader" : "Guru"}
                    </Badge>
                  </div>

                  <div className="pt-2 border-t border-border/60 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      {presenceInfo.isOnline ? (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          🟢 Online Aktif
                        </span>
                      ) : presenceInfo.isIdle ? (
                        <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          🟡 Idle (Background)
                        </span>
                      ) : (
                        <span className="text-muted-foreground flex items-center gap-1">
                          ⚪ Offline
                        </span>
                      )}
                    </div>

                    {presence && (
                      <>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Halaman:</span>
                          <span className="font-medium text-foreground truncate max-w-[180px]">
                            {getPageName(presence.currentPath)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Peranti:</span>
                          <span className="font-medium text-foreground truncate max-w-[180px]">
                            {presence.deviceInfo}
                          </span>
                        </div>
                      </>
                    )}

                    <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border/40 text-[11px]">
                      <span>Aktif terakhir:</span>
                      <span className="font-mono font-medium text-foreground">
                        {presence ? formatRelativeTime(presence.lastSeenAt, now) : "Tidak Aktif"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
