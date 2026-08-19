import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpenText, Heart, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/logout")({
  head: () => ({
    meta: [
      { title: "Logout Berhasil | Griya Huffazh Quran Upgrading" },
      {
        name: "description",
        content: "Anda telah berhasil keluar dari sistem Griya Huffazh Quran Upgrading.",
      },
    ],
  }),
  component: LogoutPage,
});

function LogoutPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4">
      <div className="w-full max-w-md text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Logo */}
        <div className="mx-auto grid size-20 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/10">
          <BookOpenText className="size-10" />
        </div>

        {/* Heart Icon Animated */}
        <div className="flex justify-center">
          <Heart className="size-8 text-primary animate-pulse" />
        </div>

        {/* Islamic Farewell Message */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', serif" }}>
            Jazakumullahu Khairan
          </h1>
          <p className="text-lg sm:text-xl font-semibold text-primary/80 leading-snug" style={{ fontFamily: "'Plus Jakarta Sans', serif" }}>
            Barakallahu Fikum
            <br />
            wa Zadakumullahu Ilman
          </p>
        </div>

        {/* Motivational Message */}
        <div className="space-y-2 px-2">
          <p className="text-base font-semibold text-primary">
            Semangat selalu! 🌟
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Terima kasih atas dedikasi dan ikhtiar Anda dalam mendidik
            serta menyimak setoran Al-Qur'an. Semoga Allah SWT membalas
            kebaikan Anda dengan sebaik-baik balasan.
          </p>
        </div>

        {/* Decorative Divider */}
        <div className="flex items-center gap-3 px-6">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="text-xs text-muted-foreground/60">✦</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
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
        <p className="text-[11px] text-muted-foreground/50 pt-2">
          Griya Huffazh Quran — Upgrading System
        </p>
      </div>
    </div>
  );
}
