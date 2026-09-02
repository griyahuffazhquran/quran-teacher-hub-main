import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpenText, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Send, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useSession } from "@/hooks/use-session";
import { loginAsync } from "@/lib/services/auth-service";
import { requestPasswordReset } from "@/lib/services/gas-api-service";
import type { Teacher } from "@/lib/data/types";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Masuk | Griya Huffazh Quran Upgrading" },
      {
        name: "description",
        content: "Masuk ke sistem manajemen upgrading guru Griya Huffazh Quran.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, ready } = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [welcomeUser, setWelcomeUser] = useState<Teacher | null>(null);

  // Forgot Password Modal State
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetUsername, setResetUsername] = useState("");
  const [resetName, setResetName] = useState("");
  const [resetPhone, setResetPhone] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (ready && user && !welcomeUser) void navigate({ to: "/" });
  }, [ready, user, navigate, welcomeUser]);

  const handleLogin = async (u: string, p: string) => {
    setError(null);
    setLoading(true);

    try {
      const result = await loginAsync(u, p);
      if (!result.ok) {
        let msg = result.error || "Gagal masuk.";
        if (msg.includes("Action POST tidak dikenal") || msg.toLowerCase().includes("action")) {
          msg = "Username atau Password yang Anda masukkan salah. Silakan periksa kembali data login Anda.";
        }
        setError(msg);
        setErrorMessage(msg);
        setErrorDialogOpen(true);
        setLoading(false);
        return;
      }
      if (!result.user) {
        const msg = "Username atau Password yang Anda masukkan salah. Silakan periksa kembali data login Anda.";
        setError(msg);
        setErrorMessage(msg);
        setErrorDialogOpen(true);
        setLoading(false);
        return;
      }
      setLoading(false);
      setWelcomeUser(result.user);

      setTimeout(() => {
        void navigate({ to: "/" });
      }, 2500);
    } catch (err) {
      console.error("Login failed:", err);
      const msg = "Username atau Password yang Anda masukkan salah. Silakan periksa kembali data login Anda.";
      setError(msg);
      setErrorMessage(msg);
      setErrorDialogOpen(true);
      setLoading(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Username dan password harus diisi.");
      return;
    }
    handleLogin(username, password);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUsername && !resetName) {
      toast.error("Mohon isi Username atau Nama Lengkap Anda.");
      return;
    }

    setResetLoading(true);
    try {
      await requestPasswordReset(resetUsername, resetName, resetPhone);
      setResetLoading(false);
      setForgotOpen(false);
      toast.success("✅ Permintaan reset kata sandi berhasil dikirim! Data telah tercatat di spreadsheet pengurus.");
      setResetUsername("");
      setResetName("");
      setResetPhone("");
    } catch (err) {
      setResetLoading(false);
      toast.error("Gagal mengirim permintaan reset kata sandi.");
    }
  };

  const goToDashboard = () => {
    void navigate({ to: "/" });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10 overflow-hidden">
      {/* Dynamic Background Glow Elements */}
      <div className="pointer-events-none absolute -top-40 -left-40 size-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 size-96 rounded-full bg-primary/15 blur-3xl" />

      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <Card className="relative w-full max-w-sm overflow-hidden border-border/80 bg-card/90 backdrop-blur-xl shadow-xl animate-zoom-in">
        {loading && (
          <div className="absolute top-0 inset-x-0 h-1 bg-primary/20 overflow-hidden">
            <div className="h-full bg-primary animate-pulse w-full origin-left" />
          </div>
        )}

        <CardHeader className="items-center text-center pt-8 pb-4">
          <div className="relative grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform duration-300 hover:scale-105">
            <BookOpenText className="size-6" />
          </div>
          <CardTitle className="mt-4 text-xl font-bold tracking-tight">Griya Huffazh Quran</CardTitle>
          <CardDescription className="text-xs">
            Sistem Upgrading & Evaluasi Setoran Guru
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 pb-8">
          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-center text-xs font-medium text-destructive animate-fade-in">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-semibold">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoComplete="username"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold">
                  Password
                </Label>
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-[11px] font-medium text-primary hover:underline"
                >
                  Lupa Kata Sandi?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-10 font-semibold shadow-md gap-2" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <span>Masuk Aplikasi</span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Forgot Password Modal Dialog */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="max-w-md p-6 space-y-4">
          <DialogHeader className="space-y-2 text-left">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <KeyRound className="size-5" />
            </div>
            <DialogTitle className="text-lg font-bold">Lupa Kata Sandi</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Kirimkan pengajuan reset kata sandi Anda. Data akan langsung dicatat ke Google Spreadsheet pengurus untuk ditindaklanjuti.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleForgotSubmit} className="space-y-3.5 pt-1">
            <div className="space-y-1">
              <Label htmlFor="reset-username" className="text-xs font-semibold">
                Username Anda
              </Label>
              <Input
                id="reset-username"
                placeholder="Contoh: ustadz_rahman"
                value={resetUsername}
                onChange={(e) => setResetUsername(e.target.value)}
                disabled={resetLoading}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="reset-name" className="text-xs font-semibold">
                Nama Lengkap
              </Label>
              <Input
                id="reset-name"
                placeholder="Contoh: Ustadz Rahman Abdillah"
                value={resetName}
                onChange={(e) => setResetName(e.target.value)}
                disabled={resetLoading}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="reset-phone" className="text-xs font-semibold">
                No HP (opsional)
              </Label>
              <Input
                id="reset-phone"
                placeholder="Contoh: 081234567890"
                value={resetPhone}
                onChange={(e) => setResetPhone(e.target.value)}
                disabled={resetLoading}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setForgotOpen(false)}
                disabled={resetLoading}
                className="h-9 text-xs"
              >
                Batal
              </Button>
              <Button type="submit" disabled={resetLoading} className="h-9 text-xs gap-1.5 font-semibold">
                {resetLoading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Send className="size-3.5" />
                )}
                <span>Kirim Permintaan</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Islamic Welcome Success Popup Dialog */}
      <Dialog open={!!welcomeUser} onOpenChange={() => goToDashboard()}>
        <DialogContent className="max-w-md text-center p-6 space-y-4">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 animate-bounce">
            <CheckCircle2 className="size-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold tracking-tight text-foreground font-serif">
              Assalamu'alaikum
            </h3>
            <p className="text-lg font-bold text-primary">
              Ahlan wa Sahlan, {welcomeUser?.name}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed pt-1">
              Berhasil masuk ke Sistem Upgrading & Evaluasi Tahfizh Griya Huffazh Quran.
              Semoga Allah memberikan keberkahan dan kemudahan dalam setiap aktivitas hari ini.
            </p>
          </div>

          <div className="pt-3">
            <Button onClick={goToDashboard} className="w-full gap-2 shadow-md">
              <span>Lanjut ke Dashboard</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Login Error Alert Popup Dialog */}
      <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent className="max-w-md text-center p-6 space-y-4">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-destructive/10 text-destructive border border-destructive/20 animate-shake">
            <ShieldAlert className="size-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight text-foreground">
              Gagal Masuk Aplikasi
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed px-2">
              {errorMessage || "Username atau Password yang Anda masukkan tidak sesuai. Silakan periksa kembali data login Anda."}
            </p>
          </div>

          <div className="pt-2">
            <Button variant="default" onClick={() => setErrorDialogOpen(false)} className="w-full font-semibold shadow-md">
              <span>Coba Lagi</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
