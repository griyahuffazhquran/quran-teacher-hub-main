import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpenText, LogIn } from "lucide-react";
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
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        void navigate({ to: "/login" });
      }, 250);
    }, 500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className={`flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8 overflow-hidden transition-all duration-300 ${isExiting ? "opacity-0 scale-98" : "animate-fade-in"}`}>
      <div className="w-full max-w-sm text-center space-y-6 bg-card/90 backdrop-blur-xl border border-border/80 p-8 rounded-3xl shadow-xl animate-zoom-in">
        {/* Logo */}
        <div className="relative mx-auto flex items-center justify-center">
          <div className="absolute size-20 rounded-full bg-primary/20 animate-pulse-ring" />
          <div className="relative grid size-16 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <BookOpenText className="size-8" />
          </div>
        </div>

        {/* Islamic Farewell Messages */}
        <div className="space-y-3">
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-primary leading-relaxed">
            السلام عليكم ورحمة الله وبركاته
          </h1>
          <h2 className="text-lg font-serif font-bold text-foreground">
            جزاكم الله خيرًا
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Sampai jumpa, semoga Allah memberkahi aktivitas Anda.
          </p>
        </div>

        {/* Instant Manual Button */}
        <div className="pt-2">
          <Button
            onClick={() => {
              setIsExiting(true);
              setTimeout(() => {
                void navigate({ to: "/login" });
              }, 200);
            }}
            className="w-full gap-2 h-10 text-xs font-semibold shadow-md"
          >
            <LogIn className="size-4" />
            <span>Kembali ke Login</span>
          </Button>
        </div>

        {/* Footer Branding */}
        <p className="text-[11px] text-muted-foreground/60">
          Griya Huffazh Quran — Upgrading System
        </p>
      </div>
    </div>
  );
}

