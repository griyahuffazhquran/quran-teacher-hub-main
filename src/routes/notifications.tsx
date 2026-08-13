import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, PlaceholderPanel } from "@/components/layout/PageHeader";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifikasi | Griya Huffazh Quran" },
      { name: "description", content: "Pemberitahuan aktivitas upgrading Anda." },
      { property: "og:title", content: "Notifikasi | Griya Huffazh Quran" },
      { property: "og:description", content: "Pemberitahuan aktivitas upgrading Anda." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader title="Notifikasi" description="Pemberitahuan aktivitas upgrading Anda." />
      <PlaceholderPanel title="Notifikasi" note="Notifikasi akan aktif setelah lapisan data dan laporan tersedia." />
    </AppShell>
  );
}
