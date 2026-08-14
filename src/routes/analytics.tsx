import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, PlaceholderPanel } from "@/components/layout/PageHeader";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analitik | Griya Huffazh Quran" },
      { name: "description", content: "Statistik lembaga berdasarkan data nyata." },
      { property: "og:title", content: "Analitik | Griya Huffazh Quran" },
      { property: "og:description", content: "Statistik lembaga berdasarkan data nyata." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader title="Analitik" description="Statistik lembaga berdasarkan data nyata." />
      <PlaceholderPanel
        title="Analitik"
        note="Grafik akan menampilkan data nyata setelah laporan tersedia."
      />
    </AppShell>
  );
}
