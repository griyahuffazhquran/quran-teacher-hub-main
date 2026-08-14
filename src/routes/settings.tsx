import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Globe,
  Info,
  Link2,
  Moon,
  Pencil,
  RefreshCw,
  Sun,
  Laptop,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/hooks/use-session";
import { getGasApiUrl, isGasApiConfigured, setGasApiUrl } from "@/lib/config/api-config";
import { syncAllFromGas } from "@/lib/services/gas-api-service";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Pengaturan | Griya Huffazh Quran" },
      { name: "description", content: "Pengaturan tampilan, tema, dan koneksi aplikasi." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, role } = useSession();
  const { theme, setTheme } = useTheme();

  const [gasUrlInput, setGasUrlInput] = useState(getGasApiUrl());
  const [syncingGas, setSyncingGas] = useState(false);

  const handleSaveGasUrl = () => {
    setGasApiUrl(gasUrlInput);
    toast.success("URL API Google Apps Script berhasil disimpan.");
  };

  const handleSyncGas = async () => {
    if (!gasUrlInput.trim()) {
      toast.error("Masukkan URL API Google Apps Script terlebih dahulu.");
      return;
    }
    setGasApiUrl(gasUrlInput);
    setSyncingGas(true);
    try {
      const res = await syncAllFromGas();
      setSyncingGas(false);
      if (res.ok) {
        toast.success("Terkoneksi ke Google Sheets! Data telah diperbarui.");
      } else {
        toast.error(res.error || "Gagal sinkronisasi data.");
      }
    } catch (err: any) {
      setSyncingGas(false);
      toast.error("Terjadi kesalahan sinkronisasi: " + (err?.message || "Koneksi gagal."));
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Pengaturan Aplikasi"
          description="Kelola mode tampilan tema (day/night) dan konfigurasi koneksi backend aplikasi."
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

          {/* Card 2: Koneksi Backend Google Sheets */}
          <Card className="border-border shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Globe className="size-5 text-primary" />
                <span>Integrasi Google Sheets API</span>
              </CardTitle>
              <CardDescription className="text-xs">
                URL Google Apps Script Web App untuk otomatisasi sinkronisasi data database.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gasUrl" className="text-xs font-semibold">
                  URL Web App Google Apps Script
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="gasUrl"
                    type="url"
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={gasUrlInput}
                    onChange={(e) => setGasUrlInput(e.target.value)}
                    className="text-xs font-mono"
                  />
                  <Button onClick={handleSaveGasUrl} variant="secondary" size="sm">
                    Simpan
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <Badge variant={isGasApiConfigured() ? "default" : "secondary"} className="text-[10px]">
                    {isGasApiConfigured() ? "Aktif & Terhubung" : "Belum Dikonfigurasi"}
                  </Badge>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncGas}
                  disabled={syncingGas}
                  className="gap-2 text-xs"
                >
                  <RefreshCw className={`size-3.5 ${syncingGas ? "animate-spin text-primary" : ""}`} />
                  <span>{syncingGas ? "Menyinkronkan..." : "Tes Sync"}</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Informasi Akun & Aplikasi */}
          <Card className="md:col-span-2 border-border shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Info className="size-5 text-blue-500" />
                <span>Informasi Aplikasi & Pengguna</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3 text-xs">
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
