import { useState } from "react";
import { Megaphone, Pin, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCollection } from "@/hooks/use-repository";
import { useSession } from "@/hooks/use-session";
import { announcementRepo } from "@/lib/data/repositories";
import { formatDate } from "@/lib/data/selectors";
import { listAnnouncements } from "@/lib/services/announcement-service";

export function AnnouncementBanner() {
  const { rows, ready } = useCollection(announcementRepo);
  const { role } = useSession();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const announcements = listAnnouncements(rows, role).filter(
    (a) => !dismissedIds.includes(a.id),
  );

  const pinned = announcements.find((a) => a.pinned) || announcements[0];

  if (!ready || !pinned) return null;

  return (
    <Card className="relative overflow-hidden border-primary/40 bg-gradient-to-r from-primary/10 via-card to-emerald-500/10 mb-6 shadow-xs animate-fade-down">
      <CardContent className="p-4 flex items-start gap-3">
        <div className="size-9 grid place-items-center rounded-xl bg-primary text-primary-foreground shrink-0 shadow-xs">
          <Megaphone className="size-4" />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            {pinned.pinned && (
              <Badge variant="default" className="text-[10px] gap-1 font-semibold">
                <Pin className="size-3" /> Disematkan
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px] capitalize">
              Pengumuman Lembaga
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {formatDate(pinned.createdAt)} • Oleh {pinned.authorName}
            </span>
          </div>

          <h4 className="font-bold text-sm text-foreground">{pinned.title}</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {pinned.content}
          </p>
        </div>

        <Button
          size="icon"
          variant="ghost"
          className="size-7 text-muted-foreground hover:text-foreground shrink-0"
          onClick={() => setDismissedIds((prev) => [...prev, pinned.id])}
          title="Tutup pengumuman"
        >
          <X className="size-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
