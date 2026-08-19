import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Award,
  BookCheck,
  Calendar,
  CheckCheck,
  CheckCircle2,
  Crown,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Pencil,
  Phone,
  ShieldCheck,
  Sparkles,
  Target as TargetIcon,
  Trophy,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useCollection } from "@/hooks/use-repository";
import { useSession } from "@/hooks/use-session";
import {
  achievementRepo,
  reportRepo,
  targetRepo,
  teacherRepo,
} from "@/lib/data/repositories";
import { activeReports, formatDate } from "@/lib/data/selectors";
import type { AchievementCategory } from "@/lib/data/types";
import {
  calculateTeacherXpAndRank,
  evaluateTeacherAchievements,
  masterAchievements,
} from "@/lib/services/achievement-service";
import { DEMO_PASSWORD } from "@/lib/services/auth-service";
import { initials, patchTeacher } from "@/lib/services/teacher-service";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profil & Gamifikasi | Griya Huffazh Quran" },
      { name: "description", content: "Profil pengajar, level upgrading, dan lencana pencapaian." },
      { property: "og:title", content: "Profil & Gamifikasi | Griya Huffazh Quran" },
      { property: "og:description", content: "Profil pengajar, level upgrading, dan lencana pencapaian." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, isUpgrader, ready: sessionReady } = useSession();
  const { rows: reportRows } = useCollection(reportRepo);
  const { rows: targetRows } = useCollection(targetRepo);
  const { rows: achievementRows } = useCollection(achievementRepo);
  const { rows: teacherRows } = useCollection(teacherRepo);

  const reports = useMemo(() => activeReports(reportRows), [reportRows]);
  const targets = useMemo(() => targetRows.filter((t) => !t.isDeleted), [targetRows]);

  // Auto-evaluate achievements when visiting profile page
  useEffect(() => {
    if (user?.id) {
      evaluateTeacherAchievements(user.id);
    }
  }, [user?.id, reportRows.length, targetRows.length]);

  // Compute Gamification Rank & XP stats
  const gamification = useMemo(() => {
    if (!user) return null;
    return calculateTeacherXpAndRank(user.id, reports, targets, achievementRows);
  }, [user, reports, targets, achievementRows]);

  // User unlocked achievements
  const userAchievements = useMemo(() => {
    if (!user) return [];
    return achievementRows.filter((a) => a.teacherId === user.id);
  }, [user, achievementRows]);

  // Form edit state
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [position, setPosition] = useState(user?.position || "");
  const [specialization, setSpecialization] = useState(user?.specialization || "");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || "");
      setPosition(user.position || "");
      setSpecialization(user.specialization || "");
    }
  }, [user]);

  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    patchTeacher(user.id, {
      name: name.trim(),
      ...(phone.trim() ? { phone: phone.trim() } : {}),
      ...(position.trim() ? { position: position.trim() } : {}),
      ...(specialization.trim() ? { specialization: specialization.trim() } : {}),
    });

    toast.success("Profil Anda berhasil diperbarui!");
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const expectedPassword = user.password || DEMO_PASSWORD;
    if (currentPassword !== expectedPassword) {
      toast.error("Password saat ini tidak sesuai.");
      return;
    }

    if (newPassword.trim().length < 4) {
      toast.error("Password baru minimal 4 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password baru tidak cocok.");
      return;
    }

    patchTeacher(user.id, { password: newPassword.trim() });
    toast.success("Password berhasil diperbarui dan disinkronkan ke backend!");

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  if (!sessionReady || !user) {
    return (
      <AppShell>
        <div className="space-y-4">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Profil & Gamifikasi Pengajar"
        description="Pantau pencapaian level upgrading, lencana penghargaan, dan aktivitas Anda."
      />

      {/* Gamification Hero Banner */}
      <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-r from-primary/10 via-card to-emerald-500/10 mb-6 shadow-sm">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* User Profile Info */}
            <div className="flex items-center gap-4">
              <Avatar className="size-16 border-2 border-primary shadow-md">
                <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-foreground tracking-tight">{user.name}</h2>
                  <Badge variant={isUpgrader ? "default" : "secondary"} className="text-xs font-semibold capitalize">
                    {isUpgrader ? "Koordinator Upgrader" : "Pengajar / Ustadz"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {user.position || user.level} • Spesialisasi: {user.specialization || "Tahfizh Al-Qur'an"}
                </p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-0.5">
                  <Calendar className="size-3 text-muted-foreground" /> Bergabung sejak: {formatDate(user.joinedAt)}
                </p>
              </div>
            </div>

            {/* Level Rank Badge Header */}
            {gamification?.currentRank && (
              <div className="bg-card border border-border p-3.5 rounded-xl flex items-center gap-3 shrink-0 shadow-2xs">
                <div className="text-3xl">{gamification.currentRank.badge}</div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Level Upgrading {gamification.currentRank.level}
                  </span>
                  <p className={`font-bold text-sm ${gamification.currentRank.color}`}>
                    {gamification.currentRank.title}
                  </p>
                  <p className="text-xs font-bold text-primary">{gamification.totalXp} Total XP</p>
                </div>
              </div>
            )}
          </div>

          {/* Level Progress Bar */}
          {gamification?.nextRank && (
            <div className="space-y-1.5 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-muted-foreground flex items-center gap-1">
                  <Sparkles className="size-3.5 text-amber-500" /> Progres Menuju Rank Berikutnya ({gamification.nextRank.title})
                </span>
                <span className="font-bold text-foreground">
                  {gamification.progressPct}% ({gamification.totalXp} / {gamification.nextRank.minXp} XP)
                </span>
              </div>
              <Progress value={gamification.progressPct} className="h-2.5 rounded-full [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-emerald-500" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gamification Quick Stats */}
      {gamification && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-6">
          <Card className="p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <BookCheck className="size-3.5 text-emerald-500" /> Total Setoran
            </span>
            <p className="text-xl font-bold text-foreground">{gamification.setoranCount} Setoran</p>
          </Card>

          <Card className="p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <CheckCheck className="size-3.5 text-blue-500" /> Sesi Menyimak
            </span>
            <p className="text-xl font-bold text-foreground">{gamification.mustamiCount} Sesi</p>
          </Card>

          <Card className="p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <TargetIcon className="size-3.5 text-amber-500" /> Target Tuntas
            </span>
            <p className="text-xl font-bold text-foreground">{gamification.completedTargetsCount} Target</p>
          </Card>

          <Card className="p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <Trophy className="size-3.5 text-indigo-500" /> Lencana Terbuka
            </span>
            <p className="text-xl font-bold text-foreground">{gamification.unlockedBadgesCount} Lencana</p>
          </Card>
        </div>
      )}

      {/* Main Profile Tabs */}
      <Tabs defaultValue="achievements" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="achievements" className="text-xs font-semibold gap-1.5">
            <Trophy className="size-3.5 text-amber-500" /> Pencapaian & Lencana
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs font-semibold gap-1.5">
            <Pencil className="size-3.5" /> Pengaturan Profil
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PENCAPAIAN & LENCANA */}
        <TabsContent value="achievements" className="mt-4 space-y-4">
          <div className="flex items-center justify-between bg-card p-3 rounded-xl border border-border">
            <span className="text-xs font-semibold text-muted-foreground">
              Katalog Lencana Gamifikasi Upgrading
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 animate-fade-up">
            {masterAchievements.map((def) => {
              const unlockedObj = userAchievements.find((a) => a && a.code === def.code);
              const isUnlocked = !!unlockedObj;

              return (
                <Card
                  key={def.code}
                  className={`transition-all ${
                    isUnlocked
                      ? "border-amber-500/40 bg-gradient-to-br from-amber-500/5 to-card shadow-xs"
                      : "opacity-60 bg-muted/30 border-dashed"
                  }`}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`size-10 grid place-items-center rounded-xl text-lg ${
                            isUnlocked
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isUnlocked ? "🏆" : <Lock className="size-4" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-foreground">{def.title}</h4>
                          <Badge variant="outline" className="text-[9px] capitalize mt-0.5">
                            {def.category}
                          </Badge>
                        </div>
                      </div>
                      <Badge
                        variant={isUnlocked ? "default" : "secondary"}
                        className="text-[10px] font-bold"
                      >
                        +{def.points} XP
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {def.description}
                    </p>

                    <div className="pt-2 border-t border-border/50 text-[10px] text-muted-foreground flex items-center justify-between">
                      {isUnlocked ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="size-3" /> Terbuka {formatDate(unlockedObj?.unlockedAt)}
                        </span>
                      ) : (
                        <span className="italic">Belum terbuka</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* TAB 2: PENGATURAN PROFIL & PASSWORD */}
        <TabsContent value="settings" className="mt-4 grid gap-6 md:grid-cols-2">
          {/* Card 1: Ubah Informasi Profil */}
          <Card className="border-border shadow-xs">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <User className="size-4 text-primary" /> Ubah Informasi Profil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Nama Lengkap</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Nomor WhatsApp / HP</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Posisi / Jabatan Pengajar</Label>
                  <Input
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Contoh: Guru Tahfizh Senior"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Spesialisasi</Label>
                  <Input
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="Contoh: Tahfizh Al-Qur'an, Tajwid"
                    className="h-9 text-xs"
                  />
                </div>

                <Button type="submit" className="w-full h-9 text-xs font-medium mt-2">
                  Simpan Perubahan Profil
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Card 2: Ganti Password Akun */}
          <Card className="border-border shadow-xs">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <KeyRound className="size-4 text-amber-500" /> Ganti Password Akun
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Password Saat Ini</Label>
                  <div className="relative">
                    <Input
                      type={showCurrentPass ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Masukkan password lama"
                      className="h-9 text-xs pr-9"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-9 w-9 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                    >
                      {showCurrentPass ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Password Baru</Label>
                  <div className="relative">
                    <Input
                      type={showNewPass ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 4 karakter"
                      className="h-9 text-xs pr-9"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-9 w-9 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowNewPass(!showNewPass)}
                    >
                      {showNewPass ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Konfirmasi Password Baru</Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPass ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang password baru"
                      className="h-9 text-xs pr-9"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-9 w-9 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                    >
                      {showConfirmPass ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </Button>
                  </div>
                </div>

                <Button type="submit" variant="secondary" className="w-full h-9 text-xs font-medium mt-2">
                  Update & Sinkron Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
