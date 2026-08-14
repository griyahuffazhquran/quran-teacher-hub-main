import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpenText, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useSession } from "@/hooks/use-session";
import { DEMO_PASSWORD, demoAccounts, login } from "@/lib/services/auth-service";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Masuk | Griya Huffazh Quran Upgrading" },
      {
        name: "description",
        content: "Masuk ke sistem manajemen upgrading guru Griya Huffazh Quran.",
      },
      { property: "og:title", content: "Masuk | Griya Huffazh Quran Upgrading" },
      {
        property: "og:description",
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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && user) void navigate({ to: "/" });
  }, [ready, user, navigate]);

  const handleLogin = (usr: string, pass: string) => {
    setLoading(true);
    setError("");

    setTimeout(() => {
      try {
        const result = login(usr, pass);
        if (!result.ok) {
          setError(result.error);
          setLoading(false);
          return;
        }
        toast.success(`Selamat datang, ${result.user.name}`);
        setLoading(false);
        void navigate({ to: "/" });
      } catch (err) {
        console.error("Login failed:", err);
        setError("Terjadi kesalahan saat masuk. Silakan coba lagi.");
        setLoading(false);
      }
    }, 300);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Username dan password harus diisi.");
      return;
    }
    handleLogin(username, password);
  };

  const handleQuickDemo = (demoUsername: string) => {
    setUsername(demoUsername);
    setPassword(DEMO_PASSWORD);
    handleLogin(demoUsername, DEMO_PASSWORD);
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
        {/* Loading Progress Bar at top of card */}
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
          <CardDescription className="text-xs">Teacher Upgrading Management System</CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 pb-8">
          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs font-medium">
                Username
              </Label>
              <Input
                id="username"
                placeholder="Masukkan username"
                autoComplete="username"
                disabled={loading}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="transition-all focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="transition-all focus-visible:ring-primary"
              />
            </div>

            {error && (
              <p className="text-xs font-medium text-destructive bg-destructive/10 p-2.5 rounded-lg border border-destructive/20 animate-fade-in">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full font-semibold shadow-md shadow-primary/20 transition-all duration-200 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <span>Masuk</span>
              )}
            </Button>
          </form>

          <div className="rounded-xl border border-border/60 bg-muted/40 p-3.5 text-xs text-muted-foreground space-y-2">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Sparkles className="size-3.5 text-amber-500" />
              <span>Akun Demo (Klik untuk langsung masuk)</span>
            </div>
            <div className="space-y-1 pt-1">
              {demoAccounts.map((a) => (
                <button
                  key={a.username}
                  type="button"
                  disabled={loading}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs font-medium transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
                  onClick={() => handleQuickDemo(a.username)}
                >
                  <span className="font-semibold text-foreground">{a.username}</span>
                  <span className="text-[11px] text-muted-foreground">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
