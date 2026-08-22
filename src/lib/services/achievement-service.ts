import { achievementRepo, reportRepo, targetRepo, teacherRepo } from "@/lib/data/repositories";
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
    code: "UPGRADER_MASTER",
    title: "Master Upgrader",
    description: "Lencana Permanen Pengurus & Upgrader Lembaga Griya Huffazh Quran.",
    category: "umum",
    icon: "ShieldCheck",
    points: 0,
  },
  {
    code: "ISTIQOMAH_5",
    title: "Pengajar Istiqomah",
    description: "Telah menyelesaikan minimal 5 setoran upgrading.",
    category: "setoran",
    icon: "BookCheck",
    points: 0,
  },
  {
    code: "GRADE_A_STREAK",
    title: "Hafiz Mumtaz",
    description: "Mendapatkan nilai A pada setoran hafalan.",
    category: "setoran",
    icon: "Award",
    points: 0,
  },
  {
    code: "FIRST_TARGET",
    title: "Pionir Target",
    description: "Berhasil menyelesaikan 1 target upgrading.",
    category: "target",
    icon: "Target",
    points: 0,
  },
  {
    code: "MUSTAMI_ACTIVE",
    title: "Mustami' Teladan",
    description: "Aktif menyimak dan mencatat minimal 3 setoran pengajar lain.",
    category: "mustami",
    icon: "CheckCheck",
    points: 0,
  },
  {
    code: "TAHSIN_SPECIALIST",
    title: "Ahli Matn & Tajwid",
    description: "Menyelesaikan setoran materi Matn dengan nilai A.",
    category: "tahsin",
    icon: "Sparkles",
    points: 0,
  },
  {
    code: "TARGET_MASTER",
    title: "Master Upgrading",
    description: "Tuntas menyelesaikan 3 target upgrading lembaga.",
    category: "target",
    icon: "Trophy",
    points: 0,
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
  reports: Report[] = [],
  targets: Target[] = [],
  achievements: Achievement[] = [],
  customRanks?: TeacherRank[],
  xpConfig?: {
    xpPerSetoran?: number;
    bonusGradeA?: number;
    xpPerMustami?: number;
    xpPerTarget?: number;
  },
) {
  const safeReports = Array.isArray(reports) ? reports : [];
  const safeTargets = Array.isArray(targets) ? targets : [];
  const safeAchievements = Array.isArray(achievements) ? achievements : [];

  const activeRanks = customRanks && customRanks.length > 0
    ? [...customRanks].sort((a, b) => a.minXp - b.minXp)
    : teacherRanks;

  const teacherReports = safeReports.filter((r) => r && r.teacherId === teacherId && !r.isDeleted);
  const teacherTargets = safeTargets.filter((t) => t && t.teacherId === teacherId && !t.isDeleted);
  const teacherMustami = safeReports.filter((r) => r && r.mustamiId === teacherId && !r.isDeleted);
  const unlockedAchievements = safeAchievements.filter((a) => a && a.teacherId === teacherId && !a.isDeleted);

  // XP Breakdown calculation
  const setoranRate = xpConfig?.xpPerSetoran ?? 30;
  const gradeARate = xpConfig?.bonusGradeA ?? 20;
  const mustamiRate = xpConfig?.xpPerMustami ?? 25;
  const targetRate = xpConfig?.xpPerTarget ?? 100;

  const setoranXp = teacherReports.length * setoranRate;
  const gradeBonusXp = teacherReports.filter((r) => r && r.grade === "A").length * gradeARate;
  const mustamiXp = teacherMustami.length * mustamiRate;
  const targetCompletedXp = teacherTargets.filter((t) => t && t.status === "tercapai").length * targetRate;
  const achievementXp = unlockedAchievements.reduce((sum, a) => sum + (Number(a?.points) || 0), 0);

  const totalXp = setoranXp + gradeBonusXp + mustamiXp + targetCompletedXp + achievementXp;

  // Determine Current Rank Level
  let currentRank: TeacherRank = activeRanks[0] || teacherRanks[0]!;
  let nextRank: TeacherRank = activeRanks[1] || activeRanks[0] || teacherRanks[0]!;

  for (let i = activeRanks.length - 1; i >= 0; i--) {
    const rank = activeRanks[i]!;
    if (totalXp >= rank.minXp) {
      currentRank = rank;
      nextRank = activeRanks[i + 1] ?? rank;
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
    setoranXp,
    gradeBonusXp,
    mustamiXp,
    targetCompletedXp,
    achievementXp,
    currentRank,
    nextRank,
    progressPct,
    setoranCount: teacherReports.length,
    mustamiCount: teacherMustami.length,
    completedTargetsCount: teacherTargets.filter((t) => t && t.status === "tercapai").length,
    unlockedBadgesCount: unlockedAchievements.length,
  };
}

const recentEvaluations = new Map<string, number>();

export function evaluateTeacherAchievements(teacherId: string): void {
  if (!teacherId) return;

  // Throttle evaluations to max once every 3 seconds per teacherId
  const now = Date.now();
  const lastEval = recentEvaluations.get(teacherId) || 0;
  if (now - lastEval < 3000) return;
  recentEvaluations.set(teacherId, now);

  const teacherObj = teacherRepo.get(teacherId);
  const reports = reportRepo.list().filter((r) => r && !r.isDeleted);
  const targets = targetRepo.list().filter((t) => t && !t.isDeleted);
  const existingAchievements = achievementRepo.list().filter((a) => a && a.teacherId === teacherId && !a.isDeleted);

  const unlockedCodes = new Set(existingAchievements.map((a) => a.code));

  if (teacherObj?.role === "upgrader" && !unlockedCodes.has("UPGRADER_MASTER")) {
    const def = masterAchievements.find((m) => m.code === "UPGRADER_MASTER");
    if (def) {
      achievementRepo.create({
        teacherId,
        code: def.code,
        title: def.title,
        description: def.description,
        category: def.category,
        icon: def.icon,
        points: 0,
        unlockedAt: new Date().toISOString(),
      });
      unlockedCodes.add("UPGRADER_MASTER");
    }
  }

  const teacherReports = reports.filter((r) => r.teacherId === teacherId);
  const teacherTargets = targets.filter((t) => t.teacherId === teacherId);
  const teacherMustami = reports.filter((r) => r.mustamiId === teacherId);

  const newToUnlock: AchievementDefinition[] = [];

  const pushIfFound = (code: string) => {
    const found = masterAchievements.find((m) => m.code === code);
    if (found) newToUnlock.push(found);
  };

  // Check ISTIQOMAH_5
  if (!unlockedCodes.has("ISTIQOMAH_5") && teacherReports.length >= 5) {
    pushIfFound("ISTIQOMAH_5");
  }

  // Check GRADE_A_STREAK
  if (!unlockedCodes.has("GRADE_A_STREAK") && teacherReports.some((r) => r.grade === "A")) {
    pushIfFound("GRADE_A_STREAK");
  }

  // Check FIRST_TARGET
  if (!unlockedCodes.has("FIRST_TARGET") && teacherTargets.some((t) => t.status === "tercapai")) {
    pushIfFound("FIRST_TARGET");
  }

  // Check MUSTAMI_ACTIVE
  if (!unlockedCodes.has("MUSTAMI_ACTIVE") && teacherMustami.length >= 3) {
    pushIfFound("MUSTAMI_ACTIVE");
  }

  // Check TAHSIN_SPECIALIST
  if (
    !unlockedCodes.has("TAHSIN_SPECIALIST") &&
    teacherReports.some((r) => r.material === "matn" && r.grade === "A")
  ) {
    pushIfFound("TAHSIN_SPECIALIST");
  }

  // Check TARGET_MASTER
  if (
    !unlockedCodes.has("TARGET_MASTER") &&
    teacherTargets.filter((t) => t.status === "tercapai").length >= 3
  ) {
    pushIfFound("TARGET_MASTER");
  }

  // Award achievements
  for (const def of newToUnlock) {
    if (!def) continue;
    const ach = achievementRepo.create({
      teacherId,
      code: def.code,
      title: def.title,
      description: def.description,
      category: def.category,
      icon: def.icon,
      points: def.points || 0,
      unlockedAt: new Date().toISOString(),
    });

    notify({
      title: `Lencana Baru Terbuka! 🏆`,
      body: `Selamat! Anda berhasil membuka lencana "${ach.title}".`,
      level: "success",
      type: "ACHIEVEMENT_UNLOCKED",
      userId: teacherId,
      achievementId: ach.id,
    });

    logActivity({
      action: "ACHIEVEMENT_UNLOCKED",
      description: `Lencana "${ach.title}" terbuka.`,
      actorId: teacherId,
      entity: "achievements",
      entityId: ach.id,
    });
  }
}
