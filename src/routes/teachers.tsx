import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

function Page() {
  const { rows: teachers, ready } = useCollection(teacherRepo);
  const { rows: reports } = useCollection(reportRepo);

  return (
    <AppShell>
      <PageHeader
        title="Data Guru"
        description="Master data guru, ustadz, dan ustadzah dari lapisan data lokal."
      />
      <Card>
        <CardContent className="p-0">
          {!ready ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead className="hidden sm:table-cell">Level</TableHead>
                  <TableHead className="hidden md:table-cell">Bergabung</TableHead>
                  <TableHead className="text-right">Setoran</TableHead>
                  <TableHead className="text-right">Rata-rata</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      Belum ada data guru.
                    </TableCell>
                  </TableRow>
                )}
                {teachers.map((t) => {
                  const own = reports.filter((r) => r.teacherId === t.id);
                  const avg = averageScore(own);
                  return (
                    <TableRow key={t.id}>
                      <TableCell>
                        <p className="font-medium">{t.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.gender === "ustadz" ? "Ustadz" : "Ustadzah"}
                          {t.phone ? ` • ${t.phone}` : ""}
                        </p>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{t.level}</TableCell>
                      <TableCell className="hidden md:table-cell">{formatDate(t.joinedAt)}</TableCell>
                      <TableCell className="text-right">{own.length}</TableCell>
                      <TableCell className="text-right">{avg ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={t.status === "aktif" ? "default" : "secondary"}>
                          {t.status === "aktif" ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
