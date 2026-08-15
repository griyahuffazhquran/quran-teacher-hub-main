import { createFileRoute } from "@tanstack/react-router";
import {
  Info,
  Laptop,
  Moon,
  Sun,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/hooks/use-session";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Pengaturan | Griya Huffazh Quran" },
      { name: "description", content: "Pengaturan tampilan dan tema aplikasi." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, role } = useSession();
  const { theme, setTheme } = useTheme();

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Pengaturan Aplikasi"
          description="Kelola mode tampilan tema (day/night) dan informasi aplikasi."
        />

        <div className="grid gap-6 md:grid-cols-2">
          {/* Card 1: Tema & Mode Tampilan (Day / Night) */}
          <Card className="border-border shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sun className="size-5 text-amber-500" />
                <span>Mode Tampilan Tema (Day / Night)</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Pilih skema warna sesuai kenyamanan mata Anda saat menggunakan aplikasi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  onClick={() => setTheme("light")}
                  className="flex-col h-auto py-3 gap-2"
                >
                  <Sun className="size-5 text-amber-500" />
                  <span className="text-xs font-semibold">Siang (Light)</span>
                </Button>

                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  onClick={() => setTheme("dark")}
                  className="flex-col h-auto py-3 gap-2"
                >
                  <Moon className="size-5 text-indigo-400" />
                  <span className="text-xs font-semibold">Malam (Dark)</span>
                </Button>

                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  onClick={() => setTheme("system")}
                  className="flex-col h-auto py-3 gap-2"
                >
                  <Laptop className="size-5 text-muted-foreground" />
                  <span className="text-xs font-semibold">Sistem</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Informasi Akun & Aplikasi */}
          <Card className="border-border shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Info className="size-5 text-blue-500" />
                <span>Informasi Aplikasi & Pengguna</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-xs">
              <div className="p-3 rounded-xl bg-muted/40 space-y-1">
                <p className="text-muted-foreground font-medium">Pengguna Aktif</p>
                <p className="font-bold text-foreground text-sm">{user?.name || "Pengajar"}</p>
                <Badge variant="outline" className="text-[10px] uppercase font-bold">
                  {role === "upgrader" ? "Upgrader / Admin" : "Guru Pengajar"}
                </Badge>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 space-y-1">
                <p className="text-muted-foreground font-medium">Nama Aplikasi</p>
                <p className="font-bold text-foreground text-sm">Griya Huffazh Quran Hub</p>
                <p className="text-muted-foreground text-[11px]">Sistem Upgrading & Setoran</p>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 space-y-1">
                <p className="text-muted-foreground font-medium">Versi & Lisensi</p>
                <p className="font-bold text-foreground text-sm">v2.4.0 (Stable)</p>
                <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                  ✓ Auto Sync Live
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
