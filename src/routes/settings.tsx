import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { allRepos, resetDemoData } from "@/lib/data/repositories";
import { SCHEMA_VERSION } from "@/lib/data/storage";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Pengaturan | Griya Huffazh Quran" },
      { name: "description", content: "Preferensi aplikasi dan pengelolaan data lokal." },
      { property: "og:title", content: "Pengaturan | Griya Huffazh Quran" },
      { property: "og:description", content: "Preferensi aplikasi dan pengelolaan data lokal." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader
        title="Pengaturan"
        description="Preferensi tampilan dan pengelolaan data lokal perangkat."
      />
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tampilan</CardTitle>
            <CardDescription>Tema terang, gelap, atau mengikuti sistem.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Ubah tema melalui tombol tema di header aplikasi.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data Lokal</CardTitle>
            <CardDescription>
              Skema v{SCHEMA_VERSION} • koleksi: {allRepos.map((r) => r.name).join(", ")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Semua data disimpan di perangkat ini. Reset akan mengembalikan data contoh awal.
            </p>
            <Button variant="destructive" size="sm" onClick={() => resetDemoData()}>
              Reset data contoh
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
