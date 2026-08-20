import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Award,
  BookCheck,
  CheckCheck,
  Plus,
  Settings2,
  Sparkles,
  Target as TargetIcon,
  Trophy,
  Users,
  ShieldCheck,
  Pencil,
  Trash2,
  Gift,
  Crown,
  Zap,
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
      { title: "Leaderboard & Lencana | Griya Huffazh Quran" },
      { name: "description", content: "Papan Peringkat Upgrading, Lencana Performa, dan Poin XP Pengajar." },
    ],
  }),
  component: AchievementsPage,
});

export function AchievementsPage() {
  const { user, isUpgrader, ready } = useSession();

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
  const [points, setPoints] = useState(0);

  // Manual Award state
  const [awardDialogOpen, setAwardDialogOpen] = useState(false);
  const [awardTeacherId, setAwardTeacherId] = useState("");
  const [awardBadgeCode, setAwardBadgeCode] = useState("");

  // Base XP Rules Config state
  const [xpPerSetoran, setXpPerSetoran] = useState(30);
  const [bonusGradeA, setBonusGradeA] = useState(20);
  const [xpPerMustami, setXpPerMustami] = useState(25);
  const [xpPerTarget, setXpPerTarget] = useState(100);

  // Leaderboard Calculation (EXCLUSIVE OF UPGRADERS)
  const leaderboard = useMemo(() => {
    return teachers
      .filter((t) => t.role !== "upgrader") // Exclude Upgrader from public Leaderboard ranking!
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
    setPoints(0);
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
        points: Number(points) || 0,
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
      body: `Selamat ${targetTeacher.name}! Pengurus secara khusus memberi Anda lencana "${badgeDef.title}".`,
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

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Leaderboard & Papan Peringkat Upgrading"
          description="Memacu semangat istiqomah hafalan & kualitas upgrading guru Griya Huffazh Quran."
          action={
            isUpgrader ? (
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
            ) : undefined
          }
        />

        {/* TOP PODIUM JUARA UPGRADING */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Trophy className="size-5 text-amber-500 animate-bounce" /> Top 3 Upgrading Mumtaz
            </h2>
            <Badge variant="secondary" className="text-xs">
              Murni Kompetisi Guru Pengajar
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {leaderboard.slice(0, 3).map((item, idx) => {
              const ranksConf = [
                {
                  label: "Juara 1 Emas",
                  icon: "🥇",
                  border: "border-amber-400 dark:border-amber-500 shadow-amber-500/20",
                  bg: "bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent",
                  badgeBg: "bg-amber-500 text-white font-bold",
                  badgeIcon: <Crown className="size-4 text-amber-400" />,
                },
                {
                  label: "Juara 2 Perak",
                  icon: "🥈",
                  border: "border-slate-300 dark:border-slate-400 shadow-slate-400/20",
                  bg: "bg-gradient-to-b from-slate-400/10 via-slate-400/5 to-transparent",
                  badgeBg: "bg-slate-500 text-white font-bold",
                  badgeIcon: null,
                },
                {
                  label: "Juara 3 Perunggu",
                  icon: "🥉",
                  border: "border-amber-700/50 dark:border-amber-600/50 shadow-amber-700/20",
                  bg: "bg-gradient-to-b from-amber-700/10 via-amber-700/5 to-transparent",
                  badgeBg: "bg-amber-800 text-white font-bold",
                  badgeIcon: null,
                },
              ][idx];

              return (
                <Card
                  key={item.teacher.id}
                  className={`relative overflow-hidden border-2 shadow-xl transition-all duration-300 hover:scale-[1.02] ${ranksConf?.border} ${ranksConf?.bg}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {ranksConf?.badgeIcon}
                        <Badge className={`text-xs px-2 py-0.5 ${ranksConf?.badgeBg}`}>
                          {ranksConf?.icon} {ranksConf?.label}
                        </Badge>
                      </div>
                      <span className="text-3xl">{item.currentRank.badge}</span>
                    </div>
                    <CardTitle className="text-lg font-extrabold pt-2 text-foreground truncate">
                      {item.teacher.name}
                    </CardTitle>
                    <CardDescription className="text-xs font-semibold text-primary">
                      {item.currentRank.title}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs pt-1">
                    <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-background/80 border border-border/50">
                      <span className="text-muted-foreground font-medium flex items-center gap-1">
                        <Zap className="size-3.5 text-amber-500" /> Perolehan XP:
                      </span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-base">
                        {item.totalXp} XP
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[11px] text-muted-foreground pt-1">
                      <span className="flex items-center gap-1">
                        <BookCheck className="size-3 text-primary" /> {item.setoranCount} Setoran
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCheck className="size-3 text-emerald-500" /> {item.mustamiCount} Mustami'
                      </span>
                      <span className="flex items-center gap-1">
                        <TargetIcon className="size-3 text-indigo-500" /> {item.completedTargetsCount} Target
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="size-3 text-amber-500" /> {item.unlockedBadgesCount} Lencana
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* TABS UTAMA (HANYA TAB LEADERBOARD DIPERTINGKATKAN, TAB LAIN KHUSUS UPGRADER) */}
        <Tabs defaultValue="leaderboard" className="space-y-4">
          <TabsList className={`flex flex-col sm:grid w-full h-auto p-1.5 gap-2 rounded-xl bg-muted/80 ${isUpgrader ? "sm:grid-cols-3" : "sm:grid-cols-1"}`}>
            <TabsTrigger value="leaderboard" className="w-full min-h-10 px-3 text-xs sm:text-sm font-semibold gap-2 justify-center whitespace-normal text-center leading-tight py-2">
              <Trophy className="size-4 shrink-0" /> <span>Papan Peringkat Seluruh Guru</span>
            </TabsTrigger>
            {isUpgrader && (
              <TabsTrigger value="badges" className="w-full min-h-10 px-3 text-xs sm:text-sm font-semibold gap-2 justify-center whitespace-normal text-center leading-tight py-2">
                <Award className="size-4 shrink-0" /> <span>Manajemen Lencana Master (CRUD)</span>
              </TabsTrigger>
            )}
            {isUpgrader && (
              <TabsTrigger value="settings" className="w-full min-h-10 px-3 text-xs sm:text-sm font-semibold gap-2 justify-center whitespace-normal text-center leading-tight py-2">
                <Settings2 className="size-4 shrink-0" /> <span>Pengaturan Poin XP</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* TAB 1: LEADERBOARD TABEL LENGKAP */}
          <TabsContent value="leaderboard" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Users className="size-4 text-primary" /> Klasemen Peringkat Guru Pengajar
                </CardTitle>
                <CardDescription className="text-xs">
                  Daftar peringkat keaktifan setoran hafalan dan upgrading seluruh Ustadz & Ustadzah.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground font-bold">
                    <tr>
                      <th className="p-3 text-center w-14">Rank</th>
                      <th className="p-3">Nama Ustadz / Ustadzah</th>
                      <th className="p-3">Gelar Upgrading</th>
                      <th className="p-3 text-center">Setoran</th>
                      <th className="p-3 text-center">Mustami'</th>
                      <th className="p-3 text-center">Target Tuntas</th>
                      <th className="p-3 text-center">Lencana</th>
                      <th className="p-3 text-right">Total XP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {leaderboard.map((item, idx) => (
                      <tr
                        key={item.teacher.id}
                        className={`hover:bg-muted/30 transition-colors ${
                          item.teacher.id === user?.id ? "bg-primary/5 font-medium" : ""
                        }`}
                      >
                        <td className="p-3 text-center font-bold text-foreground">
                          {idx === 0 ? "🥇 #1" : idx === 1 ? "🥈 #2" : idx === 2 ? "🥉 #3" : `#${idx + 1}`}
                        </td>
                        <td className="p-3 font-semibold text-foreground flex items-center gap-2">
                          <span>{item.teacher.name}</span>
                          {item.teacher.id === user?.id && (
                            <Badge variant="outline" className="text-[10px] text-primary border-primary">
                              Anda
                            </Badge>
                          )}
                        </td>
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
                        <td className="p-3 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                          {item.totalXp} XP
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: MASTER BADGES CRUD (UPGRADER ONLY) */}
          {isUpgrader && (
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
          )}

          {/* TAB 3: XP RULES SETTINGS (UPGRADER ONLY) */}
          {isUpgrader && (
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
          )}
        </Tabs>
      </div>

      {/* DIALOG CREATE / EDIT MASTER BADGE (UPGRADER ONLY) */}
      {isUpgrader && (
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
                    min="0"
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
      )}

      {/* DIALOG MANUAL AWARD BADGE (UPGRADER ONLY) */}
      {isUpgrader && (
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
      )}

      {/* CONFIRM DELETE BADGE DIALOG */}
      {isUpgrader && (
        <ConfirmDeleteDialog
          open={!!deleteBadgeTarget}
          onOpenChange={(open) => !open && setDeleteBadgeTarget(null)}
          title="Konfirmasi Hapus Lencana"
          itemName={deleteBadgeTarget?.title}
          onConfirm={handleDeleteBadge}
        />
      )}
    </AppShell>
  );
}
