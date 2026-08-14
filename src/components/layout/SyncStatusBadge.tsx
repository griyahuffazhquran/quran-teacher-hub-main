import { RefreshCw, CheckCircle2, AlertCircle, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAutoSync } from "@/hooks/use-auto-sync";
import { cn } from "@/lib/utils";

export function SyncStatusBadge() {
  const { status, lastSyncedAt, errorMessage, triggerSync } = useAutoSync();

  const formatTime = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void triggerSync()}
            className={cn(
              "h-8 gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-all duration-200",
              status === "syncing" && "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
              status === "synced" && "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
              status === "error" && "border-destructive/40 bg-destructive/10 text-destructive",
              status === "idle" && "border-border/60 bg-muted/50 text-muted-foreground",
            )}
          >
            {status === "syncing" && (
              <>
                <RefreshCw className="size-3.5 animate-spin text-amber-500" />
                <span className="hidden sm:inline">Menyinkron...</span>
              </>
            )}

            {status === "synced" && (
              <>
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
                </span>
                <Cloud className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Live Sheets</span>
              </>
            )}

            {status === "error" && (
              <>
                <AlertCircle className="size-3.5 text-destructive" />
                <span className="hidden sm:inline">Gagal Sync</span>
              </>
            )}

            {status === "idle" && (
              <>
                <RefreshCw className="size-3.5 opacity-70" />
                <span className="hidden sm:inline">Sync</span>
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs font-normal max-w-xs">
          {status === "syncing" && "Sedang mengambil data terbaru dari Google Sheets..."}
          {status === "synced" && (
            <div>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="size-3.5" /> Terhubung ke Google Sheets
              </p>
              <p className="mt-0.5 text-muted-foreground text-[11px]">
                Terakhir diperbarui: {formatTime(lastSyncedAt) || "Baru saja"}. Klik untuk sinkronisasi ulang.
              </p>
            </div>
          )}
          {status === "error" && (
            <div>
              <p className="font-semibold text-destructive">Gagal Sinkronisasi</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {errorMessage || "Tidak dapat terhubung ke Google Apps Script."} Klik untuk mencoba lagi.
              </p>
            </div>
          )}
          {status === "idle" && "Klik untuk sinkronisasi data dengan Google Sheets."}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
