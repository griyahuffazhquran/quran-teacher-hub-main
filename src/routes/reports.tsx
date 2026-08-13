import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, PlaceholderPanel } from "@/components/layout/PageHeader";

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
  return (
    <AppShell>
      <PageHeader title="Setoran" description="Catatan setoran materi dan penilaian mustami'." />
      <PlaceholderPanel title="Form setoran" note="Pembuatan laporan setoran akan tersedia pada fase Core Report." />
    </AppShell>
  );
}
