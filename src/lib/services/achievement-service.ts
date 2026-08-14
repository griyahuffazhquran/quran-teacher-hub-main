import { achievementRepo, reportRepo, targetRepo } from "@/lib/data/repositories";
import type { Achievement, AchievementCategory, Report, Target, TeacherRank } from "@/lib/data/types";
import { logActivity, notify } from "./notification-service";

export type AchievementDefinition = {
  code: string;
  title: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  points: number;
};

export const masterAchievements: AchievementDefinition[] = [
  {
    code: "ISTIQOMAH_5",
    title: "Pengajar Istiqomah",
    description: "Telah menyelesaikan minimal 5 setoran upgrading.",
    category: "setoran",
    icon: "BookCheck",
    points: 100,
  },
  {
    code: "GRADE_A_STREAK",
    title: "Hafiz Mumtaz",
    description: "Mendapatkan nilai A pada setoran hafalan.",
    category: "setoran",
    icon: "Award",
    points: 150,
  },
  {
    code: "FIRST_TARGET",
    title: "Pionir Target",
    description: "Berhasil menyelesaikan 1 target upgrading.",
    category: "target",
    icon: "Target",
    points: 200,
  },
  {
    code: "MUSTAMI_ACTIVE",
    title: "Mustami' Teladan",
    description: "Aktif menyimak dan mencatat minimal 3 setoran pengajar lain.",
    category: "mustami",
    icon: "CheckCheck",
    points: 180,
  },
  {
    code: "TAHSIN_SPECIALIST",
    title: "Ahli Matn & Tajwid",
    description: "Menyelesaikan setoran materi Matn dengan nilai A.",
    category: "tahsin",
    icon: "Sparkles",
    points: 220,
  },
  {
    code: "TARGET_MASTER",
    title: "Master Upgrading",
    description: "Tuntas menyelesaikan 3 target upgrading lembaga.",
    category: "target",
    icon: "Trophy",
    points: 350,
  },
];

export const teacherRanks: TeacherRank[] = [
  { level: 1, title: "Tholibul 'Ilm", minXp: 0, badge: "🌱", color: "text-slate-500" },
  { level: 2, title: "Al-Mujtahid", minXp: 200, badge: "⚡", color: "text-blue-500" },
  { level: 3, title: "Al-Hafizh Al-Mutqin", minXp: 500, badge: "⭐", color: "text-amber-500" },
  { level: 4, title: "Al-Muqri' Al-Kabiir", minXp: 1000, badge: "👑", color: "text-indigo-500" },
  { level: 5, title: "Ustazh Al-Upgrading", minXp: 2000, badge: "🏆", color: "text-emerald-500" },
];

export function calculateTeacherXpAndRank(
  teacherId: string,
  reports: Report[],
  targets: Target[],
  achievements: Achievement[],
) {
  const teacherReports = reports.filter((r) => r.teacherId === teacherId && !r.isDeleted);
  const teacherTargets = targets.filter((t) => t.teacherId === teacherId && !t.isDeleted);
  const teacherMustami = reports.filter((r) => r.mustamiId === teacherId && !r.isDeleted);
  const unlockedAchievements = achievements.filter((a) => a.teacherId === teacherId);

  // XP Breakdown calculation
  const setoranXp = teacherReports.length * 30; // 30 XP per setoran
  const gradeBonusXp = teacherReports.filter((r) => r.grade === "A").length * 20; // +20 XP for Grade A
  const mustamiXp = teacherMustami.length * 25; // 25 XP per assessment as mustami
  const targetCompletedXp = teacherTargets.filter((t) => t.status === "tercapai").length * 100; // 100 XP per target
  const achievementXp = unlockedAchievements.reduce((sum, a) => sum + a.points, 0);

  const totalXp = setoranXp + gradeBonusXp + mustamiXp + targetCompletedXp + achievementXp;

  // Determine Current Rank Level
  let currentRank: TeacherRank = teacherRanks[0]!;
  let nextRank: TeacherRank = teacherRanks[1]!;

  for (let i = teacherRanks.length - 1; i >= 0; i--) {
    const rank = teacherRanks[i]!;
    if (totalXp >= rank.minXp) {
      currentRank = rank;
      nextRank = teacherRanks[i + 1] ?? rank;
      break;
    }
  }

  const currentLevelMin = currentRank.minXp;
  const nextLevelMin = nextRank.minXp;
  const isMaxLevel = currentRank.level === nextRank.level;

  const xpInCurrentLevel = totalXp - currentLevelMin;
  const levelXpRequired = nextLevelMin - currentLevelMin;
  const progressPct = isMaxLevel
    ? 100
    : Math.min(100, Math.round((xpInCurrentLevel / Math.max(1, levelXpRequired)) * 100));

  return {
    totalXp,
    currentRank,
    nextRank,
    progressPct,
    setoranCount: teacherReports.length,
    mustamiCount: teacherMustami.length,
    completedTargetsCount: teacherTargets.filter((t) => t.status === "tercapai").length,
    unlockedBadgesCount: unlockedAchievements.length,
  };
}

export function evaluateTeacherAchievements(teacherId: string): void {
  const reports = reportRepo.list().filter((r) => !r.isDeleted);
  const targets = targetRepo.list().filter((t) => !t.isDeleted);
  const existingAchievements = achievementRepo.list().filter((a) => a.teacherId === teacherId);

  const unlockedCodes = new Set(existingAchievements.map((a) => a.code));

  const teacherReports = reports.filter((r) => r.teacherId === teacherId);
  const teacherTargets = targets.filter((t) => t.teacherId === teacherId);
  const teacherMustami = reports.filter((r) => r.mustamiId === teacherId);

  const newToUnlock: AchievementDefinition[] = [];

  // Check ISTIQOMAH_5
  if (!unlockedCodes.has("ISTIQOMAH_5") && teacherReports.length >= 5) {
    newToUnlock.push(masterAchievements.find((m) => m.code === "ISTIQOMAH_5")!);
  }

  // Check GRADE_A_STREAK
  if (!unlockedCodes.has("GRADE_A_STREAK") && teacherReports.some((r) => r.grade === "A")) {
    newToUnlock.push(masterAchievements.find((m) => m.code === "GRADE_A_STREAK")!);
  }

  // Check FIRST_TARGET
  if (!unlockedCodes.has("FIRST_TARGET") && teacherTargets.some((t) => t.status === "tercapai")) {
    newToUnlock.push(masterAchievements.find((m) => m.code === "FIRST_TARGET")!);
  }

  // Check MUSTAMI_ACTIVE
  if (!unlockedCodes.has("MUSTAMI_ACTIVE") && teacherMustami.length >= 3) {
    newToUnlock.push(masterAchievements.find((m) => m.code === "MUSTAMI_ACTIVE")!);
  }

  // Check TAHSIN_SPECIALIST
  if (
    !unlockedCodes.has("TAHSIN_SPECIALIST") &&
    teacherReports.some((r) => r.material === "matn" && r.grade === "A")
  ) {
    newToUnlock.push(masterAchievements.find((m) => m.code === "TAHSIN_SPECIALIST")!);
  }

  // Check TARGET_MASTER
  if (
    !unlockedCodes.has("TARGET_MASTER") &&
    teacherTargets.filter((t) => t.status === "tercapai").length >= 3
  ) {
    newToUnlock.push(masterAchievements.find((m) => m.code === "TARGET_MASTER")!);
  }

  // Award achievements
  for (const def of newToUnlock) {
    const ach = achievementRepo.create({
      teacherId,
      code: def.code,
      title: def.title,
      description: def.description,
      category: def.category,
      icon: def.icon,
      points: def.points,
      unlockedAt: new Date().toISOString(),
    });

    notify({
      title: `Lencana Baru Terbuka! 🏆`,
      body: `Selamat! Anda berhasil membuka lencana "${ach.title}" (+${ach.points} XP).`,
      level: "success",
      type: "ACHIEVEMENT_UNLOCKED",
      userId: teacherId,
      achievementId: ach.id,
    });

    logActivity({
      action: "ACHIEVEMENT_UNLOCKED",
      description: `Lencana "${ach.title}" (+${ach.points} XP) terbuka.`,
      actorId: teacherId,
      entity: "achievements",
      entityId: ach.id,
    });
  }
}
