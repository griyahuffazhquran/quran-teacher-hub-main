import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

const stats = [
  { label: "Total Setoran", value: "—" },
  { label: "Setoran Bulan Ini", value: "—" },
  { label: "Rata-rata Nilai", value: "—" },
  { label: "PR Aktif", value: "—" },
];

function Dashboard() {
  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        description="Ringkasan aktivitas upgrading. Data akan aktif setelah lapisan data dibangun."
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
              <p className="text-2xl font-semibold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Aktivitas Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Belum ada data. Fondasi layout, navigasi, dan tema sudah siap.
          </p>
        </CardContent>
      </Card>
    </AppShell>
  );
}
