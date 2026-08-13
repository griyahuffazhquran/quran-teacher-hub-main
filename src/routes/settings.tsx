import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, PlaceholderPanel } from "@/components/layout/PageHeader";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Pengaturan | Griya Huffazh Quran" },
      { name: "description", content: "Preferensi aplikasi dan tampilan." },
      { property: "og:title", content: "Pengaturan | Griya Huffazh Quran" },
      { property: "og:description", content: "Preferensi aplikasi dan tampilan." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader title="Pengaturan" description="Preferensi aplikasi dan tampilan." />
      <PlaceholderPanel title="Pengaturan" note="Tema dapat diubah dari header. Pengaturan lanjutan menyusul." />
    </AppShell>
  );
}
