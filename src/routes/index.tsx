import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection } from "@/hooks/use-repository";
import { reportRepo, teacherRepo } from "@/lib/data/repositories";
import {
  averageScore,
  formatDate,
  isThisMonth,
  pendingHomework,
  reportTypeLabel,
  sortByDateDesc,
  teacherName,
} from "@/lib/data/selectors";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard | Griya Huffazh Quran Upgrading" },
      {
        name: "description",
        content:
          "Dashboard sistem manajemen upgrading guru Griya Huffazh Quran: pantau setoran, target, dan progres pengajar.",
      },
      { property: "og:title", content: "Dashboard | Griya Huffazh Quran Upgrading" },
      {
        property: "og:description",
        content: "Pantau setoran, target, dan progres upgrading guru Griya Huffazh Quran.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { rows: reports, ready } = useCollection(reportRepo);
  const { rows: teachers } = useCollection(teacherRepo);

  const avg = averageScore(reports);
  const stats = [
    { label: "Total Setoran", value: String(reports.length) },
    { label: "Setoran Bulan Ini", value: String(reports.filter((r) => isThisMonth(r.date)).length) },
    { label: "Rata-rata Nilai", value: avg === null ? "—" : String(avg) },
    { label: "PR Aktif", value: String(pendingHomework(reports).length) },
  ];

  const recent = sortByDateDesc(reports).slice(0, 5);

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        description="Ringkasan aktivitas upgrading berdasarkan data tersimpan di perangkat ini."
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ready ? (
                <p className="text-2xl font-semibold">{stat.value}</p>
              ) : (
                <Skeleton className="h-8 w-12" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Setoran Terakhir</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!ready && <Skeleton className="h-16 w-full" />}
          {ready && recent.length === 0 && (
            <p className="text-sm text-muted-foreground">Belum ada setoran tercatat.</p>
          )}
          {ready &&
            recent.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{teacherName(teachers, r.teacherId)}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.surah} {r.fromAyah}–{r.toAyah} • {formatDate(r.date)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{reportTypeLabel[r.type]}</Badge>
                  <span className="text-sm font-semibold">{r.score}</span>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
