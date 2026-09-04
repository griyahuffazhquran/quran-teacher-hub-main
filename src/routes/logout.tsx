import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpenText, Heart, LogIn, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

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
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          void navigate({ to: "/login" });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const progressValue = (countdown / 3) * 100;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4 py-8">
      <div className="w-full max-w-md text-center space-y-6 bg-card/80 backdrop-blur-md border border-border/60 p-6 sm:p-8 rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in duration-500">
        {/* Logo */}
        <div className="mx-auto grid size-20 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/10">
          <BookOpenText className="size-10" />
        </div>

        {/* Heart Icon Animated */}
        <div className="flex justify-center items-center gap-1.5">
          <Sparkles className="size-5 text-amber-500 animate-spin" />
          <Heart className="size-8 text-primary animate-pulse" />
          <Sparkles className="size-5 text-amber-500 animate-spin" />
        </div>

        {/* Islamic Farewell Message */}
        <div className="space-y-2">
          <h1
            className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', serif" }}
          >
            Jazakumullahu Khairan
          </h1>
          <p
            className="text-lg sm:text-xl font-bold text-primary leading-snug"
            style={{ fontFamily: "'Plus Jakarta Sans', serif" }}
          >
            Barakallahu Fikum
            <br />
            wa Zadakumullahu Ilman 🌟
          </p>
        </div>

        {/* Motivational Message */}
        <div className="space-y-2 px-2 bg-primary/5 p-4 rounded-xl border border-primary/10">
          <p className="text-sm sm:text-base font-semibold text-primary">
            Semangat Selalu Pengajar Al-Qur'an!
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Terima kasih atas dedikasi dan ikhtiar Anda dalam mendidik serta menyimak setoran Al-Qur'an.
            Semoga Allah Subhanahu wa Ta'ala senantiasa memberkahi ilmu, hafalan, dan mengganjar Anda dengan sebaik-baik balasan.
          </p>
        </div>

        {/* Visual 3-Second Countdown */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
            <span>Mengarahkan ke Form Login...</span>
            <span className="text-primary font-bold text-sm">{countdown} Detik</span>
          </div>
          <Progress value={progressValue} className="h-2 bg-primary/15" />
        </div>

        {/* Instant Manual Button */}
        <div className="pt-2">
          <Button
            onClick={() => void navigate({ to: "/login" })}
            className="w-full gap-2.5 h-11 text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200"
          >
            <LogIn className="size-4" />
            <span>Ke Form Login Sekarang ({countdown}s)</span>
          </Button>
        </div>

        {/* Footer Branding */}
        <p className="text-[11px] text-muted-foreground/60 pt-1">
          Griya Huffazh Quran — Upgrading System
        </p>
      </div>
    </div>
  );
}
