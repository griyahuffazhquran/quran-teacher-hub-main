import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Award,
  BarChart3,
  BookCheck,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Filter,
  GraduationCap,
  Sparkles,
  Target as TargetIcon,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollection } from "@/hooks/use-repository";
import { useSession } from "@/hooks/use-session";
import {
  achievementRepo,
  reportRepo,
  targetRepo,
  teacherRepo,
} from "@/lib/data/repositories";
import type { TimeRange } from "@/lib/services/analytics-service";
import {
  computeInstitutionalAnalytics,
  generateExecutiveSummaryMarkdown,
} from "@/lib/services/analytics-service";
import { initials } from "@/lib/services/teacher-service";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analitik & Upgrader Hub | Griya Huffazh Quran" },
      {
        name: "description",
        content: "Statistik performa upgrading guru, distribusi nilai, dan laporan eksekutif.",
      },
      { property: "og:title", content: "Analitik & Upgrader Hub | Griya Huffazh Quran" },
      {
        property: "og:description",
        content: "Statistik performa upgrading guru, distribusi nilai, dan laporan eksekutif.",
      },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { rows: reportRows, ready: reportsReady } = useCollection(reportRepo);
  const { rows: targetRows } = useCollection(targetRepo);
  const { rows: teacherRows } = useCollection(teacherRepo);
  const { rows: achievementRows } = useCollection(achievementRepo);
  const { isUpgrader } = useSession();

  const [timeRange, setTimeRange] = useState<TimeRange>("all");

  const analytics = useMemo(() => {
    return computeInstitutionalAnalytics(
      reportRows,
      targetRows,
      teacherRows,
      achievementRows,
      timeRange,
    );
  }, [reportRows, targetRows, teacherRows, achievementRows, timeRange]);

  const handleCopySummary = () => {
    const markdown = generateExecutiveSummaryMarkdown(analytics);
    navigator.clipboard.writeText(markdown);
    toast.success("Ringkasan evaluasi eksekutif telah disalin ke clipboard!");
  };

  return (
    <AppShell>
      {/* Page Header */}
      <PageHeader
        title="Analitik Upgrading Lembaga"
        description="Pusat pemantauan performa upgrading guru, evaluasi nilai, dan laporan eksekutif."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopySummary}
              className="text-xs font-medium gap-1.5"
            >
              <Copy className="size-3.5" /> Salin Ringkasan
            </Button>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3.5 rounded-xl border border-border mb-6">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">Rentang Waktu Data:</span>
        </div>
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
          <SelectTrigger className="h-9 text-xs w-48">
            <SelectValue placeholder="Semua Waktu" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Waktu</SelectItem>
            <SelectItem value="this_month">Bulan Ini</SelectItem>
            <SelectItem value="last_3_months">3 Bulan Terakhir</SelectItem>
            <SelectItem value="this_year">Tahun Ini</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Executive KPI Overview Grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-6">
        <Card className="relative overflow-hidden p-4 space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Total Setoran</span>
            <BookCheck className="size-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {reportsReady ? analytics.totalReports : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">Setoran terverifikasi</p>
        </Card>

        <Card className="relative overflow-hidden p-4 space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Rata-rata Nilai</span>
            <GraduationCap className="size-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {reportsReady ? `${analytics.avgInstitutionalScore} / 100` : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">Predikat rata-rata lembaga</p>
        </Card>

        <Card className="relative overflow-hidden p-4 space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Tuntas Target</span>
            <TargetIcon className="size-4 text-teal-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {reportsReady ? `${analytics.targetCompletionRate}%` : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">
            {analytics.completedTargets} dari {analytics.totalTargets} target tuntas
          </p>
        </Card>

        <Card className="relative overflow-hidden p-4 space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Penyelesaian PR</span>
            <Clock className="size-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {reportsReady ? `${analytics.homeworkResolutionRate}%` : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">
            {analytics.completedHomeworks} dari {analytics.totalHomeworks} PR selesai
          </p>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full justify-start sm:w-auto">
          <TabsTrigger value="overview" className="text-xs font-semibold gap-1.5">
            <BarChart3 className="size-3.5" /> Overview & Grafik
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="text-xs font-semibold gap-1.5">
            <Trophy className="size-3.5 text-amber-500" /> Leaderboard & Performa Guru
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW & GRAFIK */}
        <TabsContent value="overview" className="mt-4 space-y-6">
          <div className="grid gap-4 md:grid-cols-12">
            {/* Visual Bar Chart: Tren Setoran 6 Bulan */}
            <Card className="md:col-span-8 border-border shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <TrendingUp className="size-4 text-primary" /> Tren Setoran 6 Bulan Terakhir
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="h-60 flex items-end justify-between gap-3 pt-8 pb-2 px-2 border-b border-border">
                  {analytics.trendData.map((item) => {
                    const maxVal = Math.max(...analytics.trendData.map((d) => d.count), 1);
                    const heightPct = item.count === 0 ? 6 : Math.max(12, Math.round((item.count / maxVal) * 100));

                    return (
                      <div key={item.month} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                        <span className="text-[11px] font-bold text-primary transition-all group-hover:scale-110">
                          {item.count}
                        </span>
                        <div className="w-full max-w-[44px] bg-muted/40 rounded-t-xl h-full flex flex-col justify-end p-0.5">
                          <div
                            style={{ height: `${heightPct}%` }}
                            className={cn(
                              "w-full rounded-t-lg transition-all duration-500 shadow-sm",
                              item.count > 0
                                ? "bg-gradient-to-t from-primary/80 to-primary group-hover:from-primary group-hover:to-primary/90"
                                : "bg-muted-foreground/20",
                            )}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-muted-foreground mt-1 text-center truncate max-w-full">
                          {item.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <span>* Total frekuensi setoran terverifikasi per bulan</span>
                  <span className="font-semibold text-foreground">
                    Rata-rata: {Math.round(analytics.totalReports / 6)} setoran/bulan
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Distribution Breakdown Card */}
            <Card className="md:col-span-4 border-border shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Award className="size-4 text-amber-500" /> Distribusi Nilai Setoran
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3.5">
                {/* Grade A */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      Nilai A (Mumtaz)
                    </span>
                    <span className="font-bold text-foreground">
                      {analytics.gradeCounts.A} ({analytics.gradePercentages.A}%)
                    </span>
                  </div>
                  <Progress value={analytics.gradePercentages.A} className="h-2 [&>div]:bg-emerald-500" />
                </div>

                {/* Grade B */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      Nilai B (Jayyid Jiddan)
                    </span>
                    <span className="font-bold text-foreground">
                      {analytics.gradeCounts.B} ({analytics.gradePercentages.B}%)
                    </span>
                  </div>
                  <Progress value={analytics.gradePercentages.B} className="h-2 [&>div]:bg-blue-500" />
                </div>

                {/* Grade C */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      Nilai C (Jayyid)
                    </span>
                    <span className="font-bold text-foreground">
                      {analytics.gradeCounts.C} ({analytics.gradePercentages.C}%)
                    </span>
                  </div>
                  <Progress value={analytics.gradePercentages.C} className="h-2 [&>div]:bg-amber-500" />
                </div>

                {/* Grade D */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      Nilai D (Perlu Bimbingan)
                    </span>
                    <span className="font-bold text-foreground">
                      {analytics.gradeCounts.D} ({analytics.gradePercentages.D}%)
                    </span>
                  </div>
                  <Progress value={analytics.gradePercentages.D} className="h-2 [&>div]:bg-rose-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sebaran Materi Upgrading Grid */}
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold">Sebaran Materi Upgrading</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="p-3 rounded-xl border border-border bg-emerald-500/5 space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Tahfizh Al-Qur'an</span>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {analytics.materialCounts.tahfizh}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Setoran ziyadah & murojaah</p>
                </div>

                <div className="p-3 rounded-xl border border-border bg-blue-500/5 space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Matn (Tajwid/Jazariyah)</span>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {analytics.materialCounts.matn}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Setoran matn tajwid</p>
                </div>

                <div className="p-3 rounded-xl border border-border bg-amber-500/5 space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Hadits</span>
                  <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                    {analytics.materialCounts.hadits}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Setoran kitab hadits</p>
                </div>

                <div className="p-3 rounded-xl border border-border bg-purple-500/5 space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Lainnya</span>
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {analytics.materialCounts.lainnya}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Materi pendukung</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: LEADERBOARD & PERFORMA GURU */}
        <TabsContent value="leaderboard" className="mt-4">
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Trophy className="size-4 text-amber-500" /> Performa & Rangking Pengajar
                </span>
                <Badge variant="secondary" className="text-xs">
                  {analytics.teacherLeaderboard.length} Pengajar
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>Nama Pengajar</TableHead>
                    <TableHead>Level / Gelar</TableHead>
                    <TableHead className="text-center">Setoran</TableHead>
                    <TableHead className="text-center">Menyimak</TableHead>
                    <TableHead className="text-center">Rata-rata Score</TableHead>
                    <TableHead className="text-center">Target Tuntas</TableHead>
                    <TableHead className="text-right">Total XP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.teacherLeaderboard.map((item, idx) => (
                    <TableRow key={item.teacher.id} className="hover:bg-muted/30">
                      <TableCell className="text-center font-bold text-xs">
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="size-8 border border-border shrink-0">
                            <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                              {initials(item.teacher.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold text-xs text-foreground">{item.teacher.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {item.teacher.position || item.teacher.level}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <span>{item.rank?.badge || "🌱"}</span>
                          <span>{item.rank?.title || "Tholibul 'Ilm"}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-semibold text-xs">
                        {item.setoranCount}
                      </TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground">
                        {item.mustamiCount}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={item.avgScore >= 85 ? "default" : "secondary"}
                          className="text-[10px] font-bold"
                        >
                          {item.avgScore > 0 ? `${item.avgScore} pts` : "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {item.completedTargets} target
                      </TableCell>
                      <TableCell className="text-right font-bold text-xs text-primary">
                        {item.totalXp} XP
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
