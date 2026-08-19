import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, BookOpenText, LogIn, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/session-expired")({
  head: () => ({
    meta: [
      { title: "Sesi Berakhir | Griya Huffazh Quran Upgrading" },
      {
        name: "description",
        content: "Sesi Anda telah berakhir karena tidak ada aktivitas. Silakan login kembali.",
      },
    ],
  }),
  component: SessionExpiredPage,
});

function SessionExpiredPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-amber-500/5 px-4">
      <div className="w-full max-w-md text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Warning Icon */}
        <div className="mx-auto grid size-20 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-lg shadow-amber-500/10">
          <ShieldAlert className="size-10" />
        </div>

        {/* Alert Badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1">
            <AlertTriangle className="size-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Sesi Berakhir</span>
          </div>
        </div>

        {/* Title & Message */}
        <div className="space-y-3">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-tight">
            Akun Anda Otomatis Keluar
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed px-2">
            Dikarenakan tidak ada aktivitas selama <span className="font-semibold text-foreground">2 jam</span>,
            akun Anda otomatis keluar demi keamanan data dan privasi Anda.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed px-2">
            Silakan login kembali untuk melanjutkan aktivitas upgrading Anda.
          </p>
        </div>

        {/* Decorative Divider */}
        <div className="flex items-center gap-3 px-6">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
          <span className="text-xs text-muted-foreground/60">⚠</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
        </div>

        {/* Re-login Button */}
        <div className="pt-2">
          <Button
            onClick={() => void navigate({ to: "/login" })}
            className="w-full gap-2.5 h-11 text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200"
          >
            <LogIn className="size-4" />
            <span>Re-login</span>
          </Button>
        </div>

        {/* Footer Branding */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <BookOpenText className="size-3.5 text-muted-foreground/40" />
          <p className="text-[11px] text-muted-foreground/50">
            Griya Huffazh Quran — Upgrading System
          </p>
        </div>
      </div>
    </div>
  );
}
