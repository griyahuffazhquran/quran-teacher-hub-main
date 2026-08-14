import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCollection } from "@/hooks/use-repository";
import { achievementRepo, targetRepo } from "@/lib/data/repositories";
import { formatDate } from "@/lib/data/selectors";
import type { Report, Teacher } from "@/lib/data/types";
import { calculateTeacherXpAndRank } from "@/lib/services/achievement-service";
import { initials, normalizeTeacher } from "@/lib/services/teacher-service";

export function TeacherDetailSheet({
  teacher,
  reports,
  onOpenChange,
  onEdit,
}: {
  teacher: Teacher | null;
  reports: Report[];
  onOpenChange: (v: boolean) => void;
  onEdit: (t: Teacher) => void;
}) {
  const { rows: targets } = useCollection(targetRepo);
  const { rows: achievements } = useCollection(achievementRepo);

  const t = teacher ? normalizeTeacher(teacher) : null;
  const own = t ? reports.filter((r) => r.teacherId === t.id && !r.isDeleted) : [];

  const gamification = useMemo(() => {
    if (!t) return null;
    return calculateTeacherXpAndRank(t.id, reports, targets, achievements);
  }, [t, reports, targets, achievements]);

  return (
    <Sheet open={!!teacher} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {t && (
          <>
            <SheetHeader>
              <SheetTitle>Detail Guru</SheetTitle>
              <SheetDescription>Profil dan ringkasan aktivitas.</SheetDescription>
            </SheetHeader>
            <div className="space-y-5 px-4 pb-6">
              <div className="flex items-center gap-3">
                <Avatar className="size-14">
                  {t.photoUrl && <AvatarImage src={t.photoUrl} alt={t.name} />}
                  <AvatarFallback>{initials(t.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-base font-semibold">{t.name}</p>
                  <p className="text-sm text-muted-foreground">@{t.username}</p>
                  {gamification?.currentRank && (
                    <Badge variant="outline" className="text-[10px] mt-1 gap-1">
                      <span>{gamification.currentRank.badge}</span>
                      <span>{gamification.currentRank.title}</span>
                    </Badge>
                  )}
                </div>
              </div>
              <Separator />
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <Row label="Role" value={t.role === "upgrader" ? "Upgrader" : "Teacher"} />
                <Row label="Jabatan" value={t.position} />
                <Row label="Spesialisasi" value={t.specialization} />
                <Row label="Level Target" value={t.level} />
                <Row label="Bergabung" value={formatDate(t.joinedAt)} />
                <Row label="No. HP" value={t.phone ?? "—"} />
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="mt-1">
                    <Badge variant={t.status === "aktif" ? "default" : "secondary"}>
                      {t.status === "aktif" ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </dd>
                </div>
                <Row label="Total Setoran" value={String(own.length)} />
                {gamification && (
                  <Row label="Total XP Gamifikasi" value={`${gamification.totalXp} XP`} />
                )}
              </dl>
              <Button className="w-full" onClick={() => onEdit(teacher!)}>
                Edit Data
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
