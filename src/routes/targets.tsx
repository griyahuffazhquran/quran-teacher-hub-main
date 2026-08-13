import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection } from "@/hooks/use-repository";
import { targetRepo, teacherRepo } from "@/lib/data/repositories";
import { formatDate, targetProgress, teacherName } from "@/lib/data/selectors";

export const Route = createFileRoute("/targets")({
  head: () => ({
    meta: [
      { title: "Target | Griya Huffazh Quran" },
      { name: "description", content: "Target pengembangan guru beserta progresnya." },
      { property: "og:title", content: "Target | Griya Huffazh Quran" },
      { property: "og:description", content: "Target pengembangan guru beserta progresnya." },
    ],
  }),
  component: Page,
});

function Page() {
  const { rows: targets, ready } = useCollection(targetRepo);
  const { rows: teachers } = useCollection(teacherRepo);

  return (
    <AppShell>
      <PageHeader
        title="Target Upgrading"
        description="Target pengembangan guru beserta progresnya."
      />
      {!ready ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : targets.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Belum ada target dibuat.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {targets.map((t) => {
            const pct = targetProgress(t);
            return (
              <Card key={t.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{t.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {teacherName(teachers, t.teacherId)} • tenggat {formatDate(t.dueDate)}
                      </p>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {t.period}
                    </Badge>
                  </div>
                  <Progress value={pct} />
                  <p className="text-xs text-muted-foreground">
                    {t.currentValue} / {t.targetValue} {t.unit} ({pct}%)
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
