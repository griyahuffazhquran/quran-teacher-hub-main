import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Award,
  BookCheck,
  CheckCheck,
  Plus,
  Settings2,
  Sparkles,
  Target as TargetIcon,
  Trophy,
  UserCheck,
  Users,
  ShieldCheck,
  Pencil,
  Trash2,
  Gift,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { useCollection } from "@/hooks/use-repository";
import { useSession } from "@/hooks/use-session";
import { achievementRepo, reportRepo, targetRepo, teacherRepo } from "@/lib/data/repositories";
import {
  calculateTeacherXpAndRank,
  masterAchievements as initialMasterAchievements,
  teacherRanks,
  type AchievementDefinition,
} from "@/lib/services/achievement-service";
import { activeReports, activeTargets, activeTeachers } from "@/lib/data/selectors";
import type { AchievementCategory, Teacher } from "@/lib/data/types";
import { logActivity, notify } from "@/lib/services/notification-service";

export const Route = createFileRoute("/achievements")({
  head: () => ({
    meta: [
      { title: "Manajemen Lencana & XP | Griya Huffazh Quran" },
      { name: "description", content: "Pengaturan Lencana, Poin XP, dan Leaderboard Performa Guru." },
    ],
  }),
  component: AchievementsPage,
});

function AchievementsPage() {
  const { user, isUpgrader, ready } = useSession();
  const navigate = useNavigate();

  const { rows: teacherRows } = useCollection(teacherRepo);
  const { rows: reportRows } = useCollection(reportRepo);
  const { rows: targetRows } = useCollection(targetRepo);
  const { rows: achievementRows } = useCollection(achievementRepo);

  const teachers = useMemo(() => activeTeachers(teacherRows), [teacherRows]);
  const reports = useMemo(() => activeReports(reportRows), [reportRows]);
  const targets = useMemo(() => activeTargets(targetRows), [targetRows]);

  // Master Achievements State
  const [masterBadges, setMasterBadges] = useState<AchievementDefinition[]>(initialMasterAchievements);
  const [badgeDialogOpen, setBadgeDialogOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<AchievementDefinition | null>(null);
  const [deleteBadgeTarget, setDeleteBadgeTarget] = useState<AchievementDefinition | null>(null);

  // Form states for Badge CRUD
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<AchievementCategory>("setoran");
  const [points, setPoints] = useState(100);

  // Manual Award state
  const [awardDialogOpen, setAwardDialogOpen] = useState(false);
  const [awardTeacherId, setAwardTeacherId] = useState("");
  const [awardBadgeCode, setAwardBadgeCode] = useState("");

  // Base XP Rules Config state
  const [xpPerSetoran, setXpPerSetoran] = useState(30);
  const [bonusGradeA, setBonusGradeA] = useState(20);
  const [xpPerMustami, setXpPerMustami] = useState(25);
  const [xpPerTarget, setXpPerTarget] = useState(100);

  // Leaderboard Calculation
  const leaderboard = useMemo(() => {
    return teachers
      .map((t) => {
        const stats = calculateTeacherXpAndRank(t.id, reports, targets, achievementRows);
        return { teacher: t, ...stats };
      })
      .sort((a, b) => b.totalXp - a.totalXp);
  }, [teachers, reports, targets, achievementRows]);

  // Open Create Badge
  const handleOpenCreateBadge = () => {
    setEditingBadge(null);
    setCode(`BADGE_${Date.now().toString().slice(-4)}`);
    setTitle("");
    setDescription("");
    setCategory("setoran");
    setPoints(100);
    setBadgeDialogOpen(true);
  };

  // Open Edit Badge
  const handleOpenEditBadge = (badge: AchievementDefinition) => {
    setEditingBadge(badge);
    setCode(badge.code);
    setTitle(badge.title);
    setDescription(badge.description);
    setCategory(badge.category);
    setPoints(badge.points);
    setBadgeDialogOpen(true);
  };

  // Submit Badge CRUD
  const handleSaveBadge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Judul Lencana wajib diisi.");
      return;
    }

    if (editingBadge) {
      setMasterBadges((prev) =>
        prev.map((b) => (b.code === editingBadge.code ? { ...b, title, description, category, points } : b)),
      );
      toast.success("Lencana master berhasil diperbarui.");
    } else {
      const newB: AchievementDefinition = {
        code: code.trim().toUpperCase() || `CUSTOM_${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        category,
        icon: "Award",
        points: Number(points) || 100,
      };
      setMasterBadges((prev) => [...prev, newB]);
      toast.success("Lencana master baru berhasil ditambahkan!");
    }
    setBadgeDialogOpen(false);
  };

  // Delete Badge
  const handleDeleteBadge = () => {
    if (!deleteBadgeTarget) return;
    setMasterBadges((prev) => prev.filter((b) => b.code !== deleteBadgeTarget.code));
    setDeleteBadgeTarget(null);
    toast.success("Lencana master berhasil dihapus.");
  };

  // Manual Award submit
  const handleAwardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!awardTeacherId || !awardBadgeCode) {
      toast.error("Pilih guru dan lencana terlebih dahulu.");
      return;
    }

    const badgeDef = masterBadges.find((b) => b.code === awardBadgeCode);
    const targetTeacher = teachers.find((t) => t.id === awardTeacherId);

    if (!badgeDef || !targetTeacher) return;

    achievementRepo.create({
      teacherId: targetTeacher.id,
      code: badgeDef.code,
      title: badgeDef.title,
      description: badgeDef.description,
      category: badgeDef.category,
      icon: badgeDef.icon,
      points: badgeDef.points,
      unlockedAt: new Date().toISOString(),
    });

    notify({
      title: `Hadiah Lencana dari Pengurus! 🏆`,
      body: `Selamat ${targetTeacher.name}! Pengurus secara khusus memberi Anda lencana "${badgeDef.title}" (+${badgeDef.points} XP).`,
      level: "success",
      type: "ACHIEVEMENT_UNLOCKED",
      userId: targetTeacher.id,
    });

    logActivity({
      action: "ACHIEVEMENT_UNLOCKED",
      description: `Lencana "${badgeDef.title}" diberikan secara manual kepada ${targetTeacher.name} oleh ${user?.name}.`,
      actorId: user?.id,
    });

    toast.success(`Lencana "${badgeDef.title}" berhasil diberikan kepada ${targetTeacher.name}!`);
    setAwardDialogOpen(false);
  };

  if (ready && !isUpgrader) {
    return (
      <AppShell>
        <div className="py-16 text-center space-y-3">
          <ShieldCheck className="mx-auto size-12 text-destructive" />
          <h2 className="text-lg font-bold text-foreground">Akses Terbatas</h2>
          <p className="text-xs text-muted-foreground">
            Halaman Manajemen Lencana & Poin XP khusus untuk Pengurus / Upgrader.
          </p>
          <Button onClick={() => void navigate({ to: "/" })} className="h-9 text-xs">
            Kembali ke Dashboard
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Manajemen Lencana, XP & Leaderboard"
          description="Kelola lencana gamifikasi, sesuaikan poin XP, dan pantau papan peringkat performa guru."
          action={
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setAwardDialogOpen(true)} variant="outline" className="h-9 text-xs gap-1.5 font-medium">
                <Gift className="size-4 text-emerald-500" />
                <span>Beri Lencana Manual</span>
              </Button>
              <Button size="sm" onClick={handleOpenCreateBadge} className="h-9 text-xs gap-1.5 font-medium shadow-md">
                <Plus className="size-4" />
                <span>Tambah Lencana Master</span>
              </Button>
            </div>
          }
        />

        <Tabs defaultValue="leaderboard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="leaderboard" className="text-xs font-semibold gap-1.5">
              <Trophy className="size-3.5" /> Papan Peringkat (Leaderboard)
            </TabsTrigger>
            <TabsTrigger value="badges" className="text-xs font-semibold gap-1.5">
              <Award className="size-3.5" /> Lencana Master (CRUD)
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs font-semibold gap-1.5">
              <Settings2 className="size-3.5" /> Pengaturan Poin XP
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: LEADERBOARD */}
          <TabsContent value="leaderboard" className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              {leaderboard.slice(0, 3).map((item, idx) => (
                <Card
                  key={item.teacher.id}
                  className={`relative overflow-hidden border-2 shadow-lg ${
                    idx === 0
                      ? "border-amber-500/50 bg-amber-500/5"
                      : idx === 1
                      ? "border-slate-400/50 bg-slate-400/5"
                      : "border-amber-700/40 bg-amber-700/5"
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge className="text-xs font-bold px-2 py-0.5">
                        Peringkat #{idx + 1}
                      </Badge>
                      <span className="text-2xl">{item.currentRank.badge}</span>
                    </div>
                    <CardTitle className="text-base font-bold pt-1">{item.teacher.name}</CardTitle>
                    <CardDescription className="text-xs">{item.currentRank.title}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1 border-t border-border/40">
                      <span className="text-muted-foreground font-medium">Total XP:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{item.totalXp} XP</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[11px] text-muted-foreground pt-1">
                      <span>• Setoran: {item.setoranCount}</span>
                      <span>• Mustami': {item.mustamiCount}</span>
                      <span>• Target: {item.completedTargetsCount}</span>
                      <span>• Lencana: {item.unlockedBadgesCount}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Users className="size-4 text-primary" /> Papan Peringkat Lengkap Guru
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground font-bold">
                    <tr>
                      <th className="p-3 text-center">Rank</th>
                      <th className="p-3">Nama Guru</th>
                      <th className="p-3">Pangkat</th>
                      <th className="p-3 text-center">Setoran</th>
                      <th className="p-3 text-center">Mustami'</th>
                      <th className="p-3 text-center">Target</th>
                      <th className="p-3 text-center">Lencana</th>
                      <th className="p-3 text-right">Total XP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {leaderboard.map((item, idx) => (
                      <tr key={item.teacher.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 text-center font-bold text-foreground">#{idx + 1}</td>
                        <td className="p-3 font-semibold text-foreground">{item.teacher.name}</td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 font-medium">
                            <span>{item.currentRank.badge}</span>
                            <span className={item.currentRank.color}>{item.currentRank.title}</span>
                          </span>
                        </td>
                        <td className="p-3 text-center text-muted-foreground">{item.setoranCount}</td>
                        <td className="p-3 text-center text-muted-foreground">{item.mustamiCount}</td>
                        <td className="p-3 text-center text-muted-foreground">{item.completedTargetsCount}</td>
                        <td className="p-3 text-center text-muted-foreground">{item.unlockedBadgesCount}</td>
                        <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {item.totalXp} XP
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: MASTER BADGES CRUD */}
          <TabsContent value="badges" className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              {masterBadges.map((badge) => (
                <Card key={badge.code} className="relative overflow-hidden border border-border">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                          <Award className="size-5" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-bold">{badge.title}</CardTitle>
                          <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                            {badge.category}
                          </Badge>
                        </div>
                      </div>
                      <Badge className="bg-emerald-600 text-white font-bold text-xs">
                        +{badge.points} XP
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs pt-1">
                    <p className="text-muted-foreground leading-relaxed">{badge.description}</p>
                    <div className="flex items-center justify-end gap-2 border-t border-border/50 pt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEditBadge(badge)}
                        className="h-7 px-2 text-[11px] gap-1"
                      >
                        <Pencil className="size-3" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteBadgeTarget(badge)}
                        className="h-7 px-2 text-[11px] text-destructive hover:text-destructive gap-1"
                      >
                        <Trash2 className="size-3" /> Hapus
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* TAB 3: XP RULES SETTINGS */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Settings2 className="size-4 text-primary" /> Pengaturan Poin XP Aktivitas
                </CardTitle>
                <CardDescription className="text-xs">
                  Atur perolehan Poin XP otomatis untuk setiap aktivitas guru dan mustami'.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">XP Per Setoran Diterima</Label>
                    <Input
                      type="number"
                      value={xpPerSetoran}
                      onChange={(e) => setXpPerSetoran(Number(e.target.value))}
                      className="h-9 text-xs"
                    />
                    <p className="text-[11px] text-muted-foreground">Poin dasar setiap kali guru menyelesaikan 1 setoran.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Bonus XP Nilai A (Mumtaz)</Label>
                    <Input
                      type="number"
                      value={bonusGradeA}
                      onChange={(e) => setBonusGradeA(Number(e.target.value))}
                      className="h-9 text-xs"
                    />
                    <p className="text-[11px] text-muted-foreground">Tambahan bonus poin jika setoran mendapat nilai A.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">XP Per Aktivitas Menyimak (Mustami')</Label>
                    <Input
                      type="number"
                      value={xpPerMustami}
                      onChange={(e) => setXpPerMustami(Number(e.target.value))}
                      className="h-9 text-xs"
                    />
                    <p className="text-[11px] text-muted-foreground">Apresiasi poin bagi guru yang menyimak & menguji setoran lain.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">XP Per Target Upgrading Tuntas</Label>
                    <Input
                      type="number"
                      value={xpPerTarget}
                      onChange={(e) => setXpPerTarget(Number(e.target.value))}
                      className="h-9 text-xs"
                    />
                    <p className="text-[11px] text-muted-foreground">Poin besar ketika target bulanan/semester berhasil tuntas.</p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button onClick={() => toast.success("Aturan Poin XP berhasil disimpan.")} className="h-9 text-xs font-semibold gap-1.5">
                    <Sparkles className="size-3.5" /> Simpan Pengaturan XP
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* DIALOG CREATE / EDIT MASTER BADGE */}
      <Dialog open={badgeDialogOpen} onOpenChange={setBadgeDialogOpen}>
        <DialogContent className="max-w-md p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingBadge ? "Edit Master Lencana" : "Tambah Master Lencana Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Buat atau perbarui lencana gamifikasi beserta bobot poin XP-nya.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveBadge} className="space-y-3.5">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Kode Unik Lencana</Label>
              <Input
                placeholder="Contoh: MUSTAMI_SUPER"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={!!editingBadge}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Judul Lencana</Label>
              <Input
                placeholder="Contoh: Pengajar Mumtaz"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Deskripsi Syarat Terbuka</Label>
              <Textarea
                placeholder="Tuliskan syarat pencapaian untuk mendapatkan lencana ini..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs min-h-[60px] resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Kategori</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as AchievementCategory)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="setoran">Setoran</SelectItem>
                    <SelectItem value="target">Target</SelectItem>
                    <SelectItem value="mustami">Mustami'</SelectItem>
                    <SelectItem value="tahsin">Tahsin & Matn</SelectItem>
                    <SelectItem value="umum">Umum</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Poin XP Bonus</Label>
                <Input
                  type="number"
                  min="10"
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                  className="h-9 text-xs"
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setBadgeDialogOpen(false)} className="h-9 text-xs">
                Batal
              </Button>
              <Button type="submit" className="h-9 text-xs font-semibold">
                Simpan Lencana
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG MANUAL AWARD BADGE */}
      <Dialog open={awardDialogOpen} onOpenChange={setAwardDialogOpen}>
        <DialogContent className="max-w-md p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Gift className="size-5 text-emerald-500" /> Berikan Lencana / Bonus XP Manual
            </DialogTitle>
            <DialogDescription className="text-xs">
              Apresiasi khusus dari pengurus kepada guru dengan menganugerahkan lencana secara langsung.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAwardSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Pilih Guru Pengajar</Label>
              <Select value={awardTeacherId} onValueChange={setAwardTeacherId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Pilih Guru Target" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Pilih Lencana Yang Diberikan</Label>
              <Select value={awardBadgeCode} onValueChange={setAwardBadgeCode}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Pilih Lencana" />
                </SelectTrigger>
                <SelectContent>
                  {masterBadges.map((b) => (
                    <SelectItem key={b.code} value={b.code}>
                      {b.title} (+{b.points} XP)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setAwardDialogOpen(false)} className="h-9 text-xs">
                Batal
              </Button>
              <Button type="submit" className="h-9 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700">
                Berikan Lencana
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CONFIRM DELETE BADGE DIALOG */}
      <ConfirmDeleteDialog
        open={!!deleteBadgeTarget}
        onOpenChange={(open) => !open && setDeleteBadgeTarget(null)}
        title="Konfirmasi Hapus Lencana"
        itemName={deleteBadgeTarget?.title}
        onConfirm={handleDeleteBadge}
      />
    </AppShell>
  );
}
