import { useEffect, useMemo, useState } from "react";
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
  Medal,
  TrendingUp,
  Eye,
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
import { fetchMasterBadgesFromGas, pushMutationToGas } from "@/lib/services/gas-api-service";
import {
  calculateTeacherXpAndRank,
  masterAchievements as initialMasterAchievements,
  teacherRanks as initialTeacherRanks,
  type AchievementDefinition,
} from "@/lib/services/achievement-service";
import { activeReports, activeTargets, activeTeachers } from "@/lib/data/selectors";
import type { AchievementCategory, Teacher, TeacherRank } from "@/lib/data/types";
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

  // Master Achievements State (Persisted in localStorage & Synced with Google Sheets)
  const [masterBadges, setMasterBadges] = useState<AchievementDefinition[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("griya_master_badges");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
      }
    }
    return initialMasterAchievements;
  });

  useEffect(() => {
    fetchMasterBadgesFromGas().then((remoteBadges) => {
      if (remoteBadges && remoteBadges.length > 0) {
        setMasterBadges(remoteBadges);
        if (typeof window !== "undefined") {
          localStorage.setItem("griya_master_badges", JSON.stringify(remoteBadges));
        }
      }
    });
  }, []);

  const saveMasterBadges = (newBadges: AchievementDefinition[]) => {
    setMasterBadges(newBadges);
    if (typeof window !== "undefined") {
      localStorage.setItem("griya_master_badges", JSON.stringify(newBadges));
    }
  };

  const [badgeDialogOpen, setBadgeDialogOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<AchievementDefinition | null>(null);
  const [deleteBadgeTarget, setDeleteBadgeTarget] = useState<AchievementDefinition | null>(null);

  // Dynamic Ranks / Gelar Upgrading State (Persisted in localStorage)
  const [customRanks, setCustomRanks] = useState<TeacherRank[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("griya_teacher_ranks");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {
          // fallback to initial
        }
      }
    }
    return initialTeacherRanks;
  });

  const saveRanks = (newRanks: TeacherRank[]) => {
    const sorted = [...newRanks]
      .sort((a, b) => a.minXp - b.minXp)
      .map((r, i) => ({ ...r, level: i + 1 }));
    setCustomRanks(sorted);
    if (typeof window !== "undefined") {
      localStorage.setItem("griya_teacher_ranks", JSON.stringify(sorted));
    }
  };

  // Gelar Upgrading CRUD State
  const [rankDialogOpen, setRankDialogOpen] = useState(false);
  const [editingRank, setEditingRank] = useState<TeacherRank | null>(null);
  const [deleteRankTarget, setDeleteRankTarget] = useState<TeacherRank | null>(null);
  const [rankTitle, setRankTitle] = useState("");
  const [rankMinXp, setRankMinXp] = useState(0);
  const [rankBadge, setRankBadge] = useState("🌱");
  const [rankColor, setRankColor] = useState("text-slate-500");

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

  // Detail Teacher Pop-up Modal State
  const [selectedTeacherDetail, setSelectedTeacherDetail] = useState<{
    teacher: Teacher;
    totalXp: number;
    setoranXp: number;
    gradeBonusXp: number;
    mustamiXp: number;
    targetCompletedXp: number;
    achievementXp: number;
    currentRank: TeacherRank;
    nextRank: TeacherRank;
    progressPct: number;
    setoranCount: number;
    mustamiCount: number;
    completedTargetsCount: number;
    unlockedBadgesCount: number;
    rankIndex: number;
  } | null>(null);

  // Leaderboard Calculation (EXCLUSIVE OF UPGRADERS)
  const leaderboard = useMemo(() => {
    return teachers
      .filter((t) => t.role !== "upgrader") // Exclude Upgrader from public Leaderboard ranking!
      .map((t) => {
        const stats = calculateTeacherXpAndRank(
          t.id,
          reports,
          targets,
          achievementRows,
          customRanks,
          { xpPerSetoran, bonusGradeA, xpPerMustami, xpPerTarget },
        );
        return { teacher: t, ...stats };
      })
      .sort((a, b) => b.totalXp - a.totalXp);
  }, [teachers, reports, targets, achievementRows, customRanks, xpPerSetoran, bonusGradeA, xpPerMustami, xpPerTarget]);

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
      const updatedList = masterBadges.map((b) =>
        b.code === editingBadge.code ? { ...b, title, description, category, points } : b,
      );
      saveMasterBadges(updatedList);
      const updatedBadge = updatedList.find((b) => b.code === editingBadge.code);
      if (updatedBadge) pushMutationToGas("masterBadges", "update", updatedBadge);
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
      const updatedList = [...masterBadges, newB];
      saveMasterBadges(updatedList);
      pushMutationToGas("masterBadges", "create", newB);
      toast.success("Lencana master baru berhasil ditambahkan!");
    }
    setBadgeDialogOpen(false);
  };

  // Delete Badge
  const handleDeleteBadge = () => {
    if (!deleteBadgeTarget) return;
    const updatedList = masterBadges.filter((b) => b.code !== deleteBadgeTarget.code);
    saveMasterBadges(updatedList);
    pushMutationToGas("masterBadges", "delete", deleteBadgeTarget);
    setDeleteBadgeTarget(null);
    toast.success("Lencana master berhasil dihapus.");
  };

  // Rank / Gelar Upgrading Handlers
  const handleOpenCreateRank = () => {
    setEditingRank(null);
    setRankTitle("");
    setRankMinXp(500);
    setRankBadge("🌟");
    setRankColor("text-indigo-500");
    setRankDialogOpen(true);
  };

  const handleOpenEditRank = (rank: TeacherRank) => {
    setEditingRank(rank);
    setRankTitle(rank.title);
    setRankMinXp(rank.minXp);
    setRankBadge(rank.badge);
    setRankColor(rank.color);
    setRankDialogOpen(true);
  };

  const handleSaveRank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rankTitle.trim()) {
      toast.error("Nama Gelar wajib diisi.");
      return;
    }

    if (editingRank) {
      const updated = customRanks.map((r) =>
        r.level === editingRank.level
          ? {
              ...r,
              title: rankTitle.trim(),
              minXp: Number(rankMinXp) || 0,
              badge: rankBadge.trim() || "🌟",
              color: rankColor,
            }
          : r,
      );
      saveRanks(updated);
      toast.success("Gelar Upgrading berhasil diperbarui.");
    } else {
      const newRank: TeacherRank = {
        level: customRanks.length + 1,
        title: rankTitle.trim(),
        minXp: Number(rankMinXp) || 0,
        badge: rankBadge.trim() || "🌟",
        color: rankColor,
      };
      saveRanks([...customRanks, newRank]);
      toast.success("Gelar Upgrading baru berhasil ditambahkan!");
    }
    setRankDialogOpen(false);
  };

  const handleDeleteRank = () => {
    if (!deleteRankTarget) return;
    if (customRanks.length <= 1) {
      toast.error("Minimal harus ada 1 Gelar Upgrading.");
      setDeleteRankTarget(null);
      return;
    }
    const filtered = customRanks.filter((r) => r.level !== deleteRankTarget.level);
    saveRanks(filtered);
    setDeleteRankTarget(null);
    toast.success("Gelar Upgrading berhasil dihapus.");
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

    const createdBadge = achievementRepo.create({
      teacherId: targetTeacher.id,
      code: badgeDef.code,
      title: badgeDef.title,
      description: badgeDef.description,
      category: badgeDef.category,
      icon: badgeDef.icon,
      points: badgeDef.points,
      unlockedAt: new Date().toISOString(),
    });

    pushMutationToGas("achievements", "create", createdBadge);

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
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={() => setAwardDialogOpen(true)} variant="outline" className="h-9 text-xs gap-1.5 font-medium">
                  <Gift className="size-4 text-emerald-500" />
                  <span>Beri Lencana Manual</span>
                </Button>
                <Button size="sm" onClick={handleOpenCreateRank} variant="secondary" className="h-9 text-xs gap-1.5 font-medium">
                  <Medal className="size-4 text-amber-500" />
                  <span>Tambah Gelar Upgrading</span>
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
              Klik Card Untuk Detail Pencapaian
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {leaderboard.slice(0, 3).map((item, idx) => {
              const ranksConf = [
                {
                  label: "Juara 1 Emas",
                  icon: "🥇",
                  border: "border-amber-400 dark:border-amber-500 shadow-amber-500/20 hover:border-amber-500",
                  bg: "bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent",
                  badgeBg: "bg-amber-500 text-white font-bold",
                  badgeIcon: <Crown className="size-4 text-amber-400" />,
                },
                {
                  label: "Juara 2 Perak",
                  icon: "🥈",
                  border: "border-slate-300 dark:border-slate-400 shadow-slate-400/20 hover:border-slate-500",
                  bg: "bg-gradient-to-b from-slate-400/10 via-slate-400/5 to-transparent",
                  badgeBg: "bg-slate-500 text-white font-bold",
                  badgeIcon: null,
                },
                {
                  label: "Juara 3 Perunggu",
                  icon: "🥉",
                  border: "border-amber-700/50 dark:border-amber-600/50 shadow-amber-700/20 hover:border-amber-700",
                  bg: "bg-gradient-to-b from-amber-700/10 via-amber-700/5 to-transparent",
                  badgeBg: "bg-amber-800 text-white font-bold",
                  badgeIcon: null,
                },
              ][idx];

              return (
                <Card
                  key={item.teacher.id}
                  onClick={() => setSelectedTeacherDetail({ ...item, rankIndex: idx })}
                  className={`group relative overflow-hidden border-2 shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer ${ranksConf?.border} ${ranksConf?.bg}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {ranksConf?.badgeIcon}
                        <Badge className={`text-xs px-2 py-0.5 ${ranksConf?.badgeBg}`}>
                          {ranksConf?.icon} {ranksConf?.label}
                        </Badge>
                      </div>
                      <span className="text-3xl transition-transform group-hover:scale-125 duration-300">
                        {item.currentRank.badge}
                      </span>
                    </div>
                    <CardTitle className="text-lg font-extrabold pt-2 text-foreground truncate flex items-center justify-between">
                      <span>{item.teacher.name}</span>
                      <Eye className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </CardTitle>
                    <CardDescription className={`text-xs font-semibold ${item.currentRank.color}`}>
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

        {/* TABS UTAMA */}
        <Tabs defaultValue="leaderboard" className="space-y-4">
          <TabsList className={`flex flex-col sm:grid w-full h-auto p-1.5 gap-2 rounded-xl bg-muted/80 ${isUpgrader ? "sm:grid-cols-4" : "sm:grid-cols-1"}`}>
            <TabsTrigger value="leaderboard" className="w-full min-h-10 px-3 text-xs sm:text-sm font-semibold gap-2 justify-center whitespace-normal text-center leading-tight py-2">
              <Trophy className="size-4 shrink-0" /> <span>Klasemen Peringkat</span>
            </TabsTrigger>
            {isUpgrader && (
              <TabsTrigger value="ranks" className="w-full min-h-10 px-3 text-xs sm:text-sm font-semibold gap-2 justify-center whitespace-normal text-center leading-tight py-2">
                <Medal className="size-4 shrink-0 text-amber-500" /> <span>Manajemen Gelar Upgrading</span>
              </TabsTrigger>
            )}
            {isUpgrader && (
              <TabsTrigger value="badges" className="w-full min-h-10 px-3 text-xs sm:text-sm font-semibold gap-2 justify-center whitespace-normal text-center leading-tight py-2">
                <Award className="size-4 shrink-0" /> <span>Lencana Master</span>
              </TabsTrigger>
            )}
            {isUpgrader && (
              <TabsTrigger value="settings" className="w-full min-h-10 px-3 text-xs sm:text-sm font-semibold gap-2 justify-center whitespace-normal text-center leading-tight py-2">
                <Settings2 className="size-4 shrink-0" /> <span>Pengaturan XP</span>
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
                  Klik nama atau baris mana saja untuk melihat detail breakdown pencapaian & perolehan XP.
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
                        onClick={() => setSelectedTeacherDetail({ ...item, rankIndex: idx })}
                        className={`hover:bg-primary/10 transition-colors cursor-pointer ${
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

          {/* TAB 2: MANAJEMEN GELAR UPGRADING (UPGRADER ONLY) */}
          {isUpgrader && (
            <TabsContent value="ranks" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Medal className="size-5 text-amber-500" /> Manajemen Gelar Upgrading Pengajar
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Atur tingkatan gelar (Level, Nama Gelar, Syarat Min XP, Badge & Warna) yang akan diraih oleh para peserta.
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={handleOpenCreateRank} className="h-9 text-xs gap-1.5 font-medium shadow-md">
                    <Plus className="size-4" />
                    <span>Tambah Gelar Baru</span>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    {customRanks.map((rank) => (
                      <Card key={rank.level} className="relative overflow-hidden border border-border">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="text-3xl">{rank.badge}</span>
                              <div>
                                <CardTitle className={`text-base font-bold ${rank.color}`}>
                                  Level {rank.level}: {rank.title}
                                </CardTitle>
                                <p className="text-xs text-muted-foreground font-medium">
                                  Minimal XP: <strong className="text-foreground">{rank.minXp} XP</strong>
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-[10px]">
                              Level {rank.level}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 text-xs pt-1">
                          <div className="flex items-center justify-between border-t border-border/50 pt-2">
                            <span className="text-[11px] text-muted-foreground">
                              Class Warna: <code className="text-primary font-mono">{rank.color}</code>
                            </span>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenEditRank(rank)}
                                className="h-7 px-2 text-[11px] gap-1"
                              >
                                <Pencil className="size-3" /> Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteRankTarget(rank)}
                                className="h-7 px-2 text-[11px] text-destructive hover:text-destructive gap-1"
                              >
                                <Trash2 className="size-3" /> Hapus
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* TAB 3: MASTER BADGES CRUD (UPGRADER ONLY) */}
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

          {/* TAB 4: XP RULES SETTINGS (UPGRADER ONLY) */}
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

      {/* DIALOG POP-UP DETAIL PENCAPAIAN GURU */}
      <Dialog open={!!selectedTeacherDetail} onOpenChange={(open) => !open && setSelectedTeacherDetail(null)}>
        {selectedTeacherDetail && (
          <DialogContent className="max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-2 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="text-4xl p-2.5 rounded-2xl bg-muted border border-border">
                  {selectedTeacherDetail.currentRank.badge}
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold flex items-center gap-2">
                    <span>{selectedTeacherDetail.teacher.name}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {selectedTeacherDetail.rankIndex === 0
                        ? "🥇 Juara 1"
                        : selectedTeacherDetail.rankIndex === 1
                          ? "🥈 Juara 2"
                          : selectedTeacherDetail.rankIndex === 2
                            ? "🥉 Juara 3"
                            : `#${selectedTeacherDetail.rankIndex + 1}`}
                    </Badge>
                  </DialogTitle>
                  <p className={`text-xs font-bold ${selectedTeacherDetail.currentRank.color}`}>
                    {selectedTeacherDetail.currentRank.title} (Level {selectedTeacherDetail.currentRank.level})
                  </p>
                </div>
              </div>
            </DialogHeader>

            {/* Progress to Next Rank */}
            <div className="space-y-1.5 bg-muted/40 p-3 rounded-xl border border-border/60">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="size-3.5 text-primary" /> Kemajuan Level berikutnya:
                </span>
                <span className="text-primary">{selectedTeacherDetail.progressPct}%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 rounded-full"
                  style={{ width: `${selectedTeacherDetail.progressPct}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground flex justify-between">
                <span>Rank: {selectedTeacherDetail.currentRank.title}</span>
                <span>Next: {selectedTeacherDetail.nextRank.title} ({selectedTeacherDetail.nextRank.minXp} XP)</span>
              </p>
            </div>

            {/* Detailed XP Breakdown Card */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="size-4 text-amber-500" /> Rincian Sumber Poin XP
              </h4>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-card border border-border space-y-1">
                  <span className="text-[11px] text-muted-foreground block">Setoran Hafalan</span>
                  <p className="font-bold text-foreground">
                    {selectedTeacherDetail.setoranCount} setoran × {xpPerSetoran} XP
                  </p>
                  <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                    + {selectedTeacherDetail.setoranXp} XP
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-card border border-border space-y-1">
                  <span className="text-[11px] text-muted-foreground block">Bonus Nilai Mumtaz (A)</span>
                  <p className="font-bold text-foreground">Apresiasi Kualitas</p>
                  <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                    + {selectedTeacherDetail.gradeBonusXp} XP
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-card border border-border space-y-1">
                  <span className="text-[11px] text-muted-foreground block">Tugas Menyimak (Mustami')</span>
                  <p className="font-bold text-foreground">
                    {selectedTeacherDetail.mustamiCount} kali × {xpPerMustami} XP
                  </p>
                  <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                    + {selectedTeacherDetail.mustamiXp} XP
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-card border border-border space-y-1">
                  <span className="text-[11px] text-muted-foreground block">Target Upgrading Tuntas</span>
                  <p className="font-bold text-foreground">
                    {selectedTeacherDetail.completedTargetsCount} target × {xpPerTarget} XP
                  </p>
                  <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                    + {selectedTeacherDetail.targetCompletedXp} XP
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                <span className="text-xs font-bold uppercase">Total akumulasi xp saat ini:</span>
                <span className="text-lg font-extrabold">{selectedTeacherDetail.totalXp} XP</span>
              </div>
            </div>

            {/* Unlocked Badges List & Manual Revocation */}
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="size-4 text-amber-500" /> Lencana Terbuka Guru Ini
                </h4>
                <Badge variant="secondary" className="text-[10px]">
                  {achievementRows.filter((a) => !a.isDeleted && a.teacherId === selectedTeacherDetail.teacher.id).length} Lencana
                </Badge>
              </div>

              {achievementRows.filter((a) => !a.isDeleted && a.teacherId === selectedTeacherDetail.teacher.id).length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-1">
                  Belum ada lencana khusus yang dimiliki guru ini.
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {achievementRows
                    .filter((a) => !a.isDeleted && a.teacherId === selectedTeacherDetail.teacher.id)
                    .map((badge) => (
                      <div
                        key={badge.id}
                        className="p-2.5 rounded-xl border border-border bg-card flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs text-foreground truncate">{badge.title}</span>
                            {badge.points > 0 && (
                              <Badge className="bg-emerald-600 text-white text-[9px] px-1 py-0 font-bold">
                                +{badge.points} XP
                              </Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground line-clamp-1">{badge.description}</p>
                        </div>

                        {isUpgrader && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-muted-foreground hover:text-destructive shrink-0"
                            title="Cabut / Hapus Lencana dari guru ini"
                            onClick={() => {
                              achievementRepo.remove(badge.id);
                              pushMutationToGas("achievements", "delete", { id: badge.id });
                              toast.success(`Lencana "${badge.title}" berhasil dicabut dari ${selectedTeacherDetail.teacher.name}.`);
                              // Recalculate popup stats
                              const updatedStats = calculateTeacherXpAndRank(
                                selectedTeacherDetail.teacher.id,
                                reports,
                                targets,
                                achievementRows.filter((a) => a.id !== badge.id),
                                customRanks,
                                { xpPerSetoran, bonusGradeA, xpPerMustami, xpPerTarget },
                              );
                              setSelectedTeacherDetail((prev) => (prev ? { ...prev, ...updatedStats } : null));
                            }}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Quick Actions Footer */}
            <DialogFooter className="pt-2 gap-2 flex-col sm:flex-row">
              {isUpgrader && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setAwardTeacherId(selectedTeacherDetail.teacher.id);
                    setSelectedTeacherDetail(null);
                    setAwardDialogOpen(true);
                  }}
                  className="h-9 text-xs gap-1.5 w-full sm:w-auto"
                >
                  <Gift className="size-3.5 text-emerald-500" /> Beri Lencana Manual
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => setSelectedTeacherDetail(null)}
                className="h-9 text-xs w-full sm:w-auto"
              >
                Tutup Detail
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* DIALOG CREATE / EDIT GELAR UPGRADING (UPGRADER ONLY) */}
      {isUpgrader && (
        <Dialog open={rankDialogOpen} onOpenChange={setRankDialogOpen}>
          <DialogContent className="max-w-md p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Medal className="size-5 text-amber-500" />
                {editingRank ? "Edit Gelar Upgrading" : "Tambah Gelar Upgrading Baru"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Tentukan nama gelar, batas minimal perolehan XP, dan badge simbol untuk para peserta.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveRank} className="space-y-3.5">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Nama Gelar Upgrading</Label>
                <Input
                  placeholder="Contoh: Al-Mujtahid, Hafizh Mutqin"
                  value={rankTitle}
                  onChange={(e) => setRankTitle(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Minimal Poin XP</Label>
                  <Input
                    type="number"
                    min="0"
                    value={rankMinXp}
                    onChange={(e) => setRankMinXp(Number(e.target.value))}
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Icon Emoji / Badge</Label>
                  <Input
                    placeholder="Contoh: 🌱, ⚡, ⭐, 👑, 🏆"
                    value={rankBadge}
                    onChange={(e) => setRankBadge(e.target.value)}
                    className="h-9 text-xs text-center text-base"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Warna Teks Title (Tailwind CSS Class)</Label>
                <Select value={rankColor} onValueChange={setRankColor}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text-slate-500">Abu-abu (Slate)</SelectItem>
                    <SelectItem value="text-blue-500">Biru (Blue)</SelectItem>
                    <SelectItem value="text-amber-500">Kuning/Emas (Amber)</SelectItem>
                    <SelectItem value="text-indigo-500">Ungu (Indigo)</SelectItem>
                    <SelectItem value="text-emerald-500">Hijau (Emerald)</SelectItem>
                    <SelectItem value="text-rose-500">Merah (Rose)</SelectItem>
                    <SelectItem value="text-purple-500">Ungu Tua (Purple)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="pt-3">
                <Button type="button" variant="outline" onClick={() => setRankDialogOpen(false)} className="h-9 text-xs">
                  Batal
                </Button>
                <Button type="submit" className="h-9 text-xs font-semibold">
                  Simpan Gelar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

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

      {/* CONFIRM DELETE RANK DIALOG */}
      {isUpgrader && (
        <ConfirmDeleteDialog
          open={!!deleteRankTarget}
          onOpenChange={(open) => !open && setDeleteRankTarget(null)}
          title="Konfirmasi Hapus Gelar Upgrading"
          itemName={deleteRankTarget?.title}
          onConfirm={handleDeleteRank}
        />
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
