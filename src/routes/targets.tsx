import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, PlaceholderPanel } from "@/components/layout/PageHeader";

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
  return (
    <AppShell>
      <PageHeader title="Target Upgrading" description="Target pengembangan guru beserta progresnya." />
      <PlaceholderPanel title="Target" note="Pembuatan dan pelacakan target akan tersedia pada fase Target." />
    </AppShell>
  );
}
