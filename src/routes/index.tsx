import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection } from "@/hooks/use-repository";
import { useSession } from "@/hooks/use-session";
import { reportRepo, teacherRepo } from "@/lib/data/repositories";
import {
  activeReports,
  averageGrade,
  formatDate,
  isThisMonth,
  materialLabel,
  pendingHomework,
  sortByDateDesc,
  teacherName,
} from "@/lib/data/selectors";
import { assessmentsOf, progressOf } from "@/lib/services/report-service";

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
  const { rows: reportRows, ready } = useCollection(reportRepo);
  const { rows: teachers } = useCollection(teacherRepo);
  const { user, isUpgrader } = useSession();

  const reports = useMemo(() => activeReports(reportRows), [reportRows]);
  const scope = useMemo(() => {
    if (!user) return reports;
    return isUpgrader ? reports : progressOf(reports, user.id);
  }, [reports, user, isUpgrader]);

  const asMustami = user ? assessmentsOf(reports, user.id) : [];
  const grade = averageGrade(scope);
  const last = sortByDateDesc(scope)[0];

  const stats = [
    { label: isUpgrader ? "Total Setoran" : "Total Setoran Saya", value: String(scope.length) },
    { label: "Setoran Bulan Ini", value: String(scope.filter((r) => isThisMonth(r.date)).length) },
    { label: "Rata-rata Nilai", value: grade ?? "—" },
    { label: "PR Aktif", value: String(pendingHomework(scope).length) },
    { label: "Aktivitas Menyimak", value: String(asMustami.length) },
    { label: "Setoran Terakhir", value: last ? formatDate(last.date) : "—" },
  ];

  const recent = sortByDateDesc(scope).slice(0, 5);

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        description={
          user
            ? `Assalamu'alaikum, ${user.name}. Berikut ringkasan upgrading Anda.`
            : "Ringkasan aktivitas upgrading."
        }
        actions={
          <Button asChild>
            <Link to="/reports">Buka Setoran</Link>
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
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
                  <p className="truncate text-sm font-medium">
                    {teacherName(teachers, r.teacherId)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.materialDetail} • {r.reference} • {formatDate(r.date)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{materialLabel[r.material]}</Badge>
                  <span className="text-sm font-semibold">{r.grade}</span>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
