import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, PlaceholderPanel } from "@/components/layout/PageHeader";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profil | Griya Huffazh Quran" },
      { name: "description", content: "Informasi akun dan aktivitas Anda." },
      { property: "og:title", content: "Profil | Griya Huffazh Quran" },
      { property: "og:description", content: "Informasi akun dan aktivitas Anda." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader title="Profil" description="Informasi akun dan aktivitas Anda." />
      <PlaceholderPanel title="Profil" note="Data profil akan terhubung setelah autentikasi dibangun." />
    </AppShell>
  );
}
