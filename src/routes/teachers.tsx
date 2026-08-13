import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, PlaceholderPanel } from "@/components/layout/PageHeader";

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
  return (
    <AppShell>
      <PageHeader title="Data Guru" description="Master data guru, ustadz, dan ustadzah." />
      <PlaceholderPanel title="Manajemen guru" note="Tambah, edit, dan nonaktifkan guru akan tersedia pada fase Teacher Management." />
    </AppShell>
  );
}
