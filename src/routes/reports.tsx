import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection } from "@/hooks/use-repository";
import { reportRepo, teacherRepo } from "@/lib/data/repositories";
import { formatDate, reportTypeLabel, sortByDateDesc, teacherName } from "@/lib/data/selectors";

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
  const { rows: reports, ready } = useCollection(reportRepo);
  const { rows: teachers } = useCollection(teacherRepo);

  return (
    <AppShell>
      <PageHeader
        title="Setoran"
        description="Catatan setoran materi dan penilaian mustami' dari data lokal."
      />
      {!ready ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Belum ada setoran tercatat.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {sortByDateDesc(reports).map((r) => (
            <Card key={r.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{teacherName(teachers, r.teacherId)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(r.date)}</p>
                  </div>
                  <Badge variant="secondary">{reportTypeLabel[r.type]}</Badge>
                </div>
                <p className="text-sm">
                  {r.surah} ayat {r.fromAyah}–{r.toAyah}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Mustami': {r.mustamiName}</span>
                  <span className="font-semibold">{r.score}</span>
                </div>
                {r.note && <p className="text-xs text-muted-foreground">Catatan: {r.note}</p>}
                {r.homework && (
                  <div className="flex flex-wrap items-center gap-1 text-xs">
                    <span>PR: {r.homework}</span>
                    <Badge variant={r.homeworkDone ? "default" : "secondary"}>
                      {r.homeworkDone ? "Selesai" : "Belum"}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
