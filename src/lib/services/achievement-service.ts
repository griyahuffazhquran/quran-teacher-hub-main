import { achievementRepo, reportRepo, targetRepo, teacherRepo } from "@/lib/data/repositories";
import type { Achievement, AchievementCategory, Report, Target, TeacherRank } from "@/lib/data/types";
import { pushMutationToGas } from "./gas-api-service";
import { logActivity, notify } from "./notification-service";

export type AchievementDefinition = {
  code: string;
  title: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  points: number;
};

export let masterAchievements: AchievementDefinition[] = [];
export let teacherRanks: TeacherRank[] = [];

export const FALLBACK_RANKS: TeacherRank[] = [
  { level: 1, title: "Tholibul 'Ilm", minXp: 0, badge: "🌱", color: "text-slate-500" },
  { level: 2, title: "Al-Mujtahid", minXp: 500, badge: "⚡", color: "text-blue-500" },
  { level: 3, title: "Al-Hafizh Al-Mutqin", minXp: 1500, badge: "⭐", color: "text-amber-500" },
  { level: 4, title: "Al-Muqri' Al-Kabiir", minXp: 4000, badge: "👑", color: "text-indigo-500" },
  { level: 5, title: "Ustazh Al-Upgrading", minXp: 10000, badge: "🏆", color: "text-emerald-500" },
];

export function setMasterAchievementsCache(list: AchievementDefinition[]): void {
  masterAchievements = list;
}

export function setTeacherRanksCache(list: TeacherRank[]): void {
  if (Array.isArray(list) && list.length > 0) {
    teacherRanks = [...list].sort((a, b) => a.minXp - b.minXp);
  }
}

export function getTeacherRanks(): TeacherRank[] {
  if (Array.isArray(teacherRanks) && teacherRanks.length > 0) {
    return teacherRanks;
  }
  return FALLBACK_RANKS;
}

export function getActiveMasterBadges(): AchievementDefinition[] {
  return masterAchievements;
}

export function saveTeacherRanks(newRanks: TeacherRank[]): TeacherRank[] {
  const sorted = [...newRanks]
    .sort((a, b) => a.minXp - b.minXp)
    .map((r, i) => ({ ...r, level: i + 1 }));
  teacherRanks = sorted;
  for (const r of sorted) {
    pushMutationToGas("teacherRanks", "update", r);
  }
  return sorted;
}

export function normalizeNameForMatching(name: string | undefined | null): string {
  if (!name) return "";
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/^(ustadz|ustaz|ustadzah|ustazah|u\.?)\s+/, "");
}

/** Calculate XP breakdown and current Teacher Rank safely */
export function calculateTeacherXpAndRank(
  teacherId: string,
  reports: Report[] = [],
  targets: Target[] = [],
  achievements: Achievement[] = [],
  customRanks: TeacherRank[] = [],
  xpConfig?: {
    xpPerSetoran?: number;
    bonusGradeA?: number;
    xpPerMustami?: number;
    xpPerTarget?: number;
  },
): {
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
  targetCompletedCount: number;
  achievementUnlockedCount: number;
  completedTargetsCount: number;
  unlockedBadgesCount: number;
} {
  const safeReports = Array.isArray(reports) ? reports : [];
  const safeTargets = Array.isArray(targets) ? targets : [];
  const safeAchievements = Array.isArray(achievements) ? achievements : [];

  const rawRanks = (customRanks && customRanks.length > 0 ? customRanks : getTeacherRanks())
    .filter((r): r is TeacherRank => Boolean(r && typeof r.minXp === "number"));

  const activeRanks = rawRanks.length > 0
    ? [...rawRanks].sort((a, b) => a.minXp - b.minXp)
    : FALLBACK_RANKS;

  const targetTeacher = teacherRepo.list().find((t) => t.id === teacherId) || teacherRepo.get(teacherId);
  const nameNorm = normalizeNameForMatching(targetTeacher?.name);

  const teacherReports = safeReports.filter((r) => {
    if (!r || r.isDeleted) return false;
    if (r.teacherId === teacherId) return true;
    if (nameNorm && r.teacherName && normalizeNameForMatching(r.teacherName) === nameNorm) return true;
    return false;
  });

  const teacherTargets = safeTargets.filter((t) => t && (t.teacherId === teacherId || (nameNorm && normalizeNameForMatching(t.teacherId) === nameNorm)) && !t.isDeleted);

  const teacherMustami = safeReports.filter((r) => {
    if (!r || r.isDeleted) return false;
    if (r.mustamiId === teacherId) return true;
    if (nameNorm && r.mustamiName && normalizeNameForMatching(r.mustamiName) === nameNorm) return true;
    return false;
  });

  const unlockedAchievements = safeAchievements.filter((a) => {
    if (!a || a.isDeleted) return false;
    if (a.teacherId === teacherId) return true;
    if (nameNorm && normalizeNameForMatching(a.teacherId) === nameNorm) return true;
    return false;
  });

  // XP Breakdown calculation
  const setoranRate = xpConfig?.xpPerSetoran ?? 30;
  const gradeARate = xpConfig?.bonusGradeA ?? 20;
  const mustamiRate = xpConfig?.xpPerMustami ?? 25;
  const targetRate = xpConfig?.xpPerTarget ?? 100;

  const completedTargetsCount = teacherTargets.filter((t) => t && t.status === "tercapai").length;
  const unlockedBadgesCount = unlockedAchievements.length;

  const setoranXp = teacherReports.length * setoranRate;
  const gradeBonusXp = teacherReports.filter((r) => r && r.grade === "A").length * gradeARate;
  const mustamiXp = teacherMustami.length * mustamiRate;
  const targetCompletedXp = completedTargetsCount * targetRate;
  const achievementXp = unlockedAchievements.reduce((sum, a) => sum + (Number(a?.points) || 0), 0);

  const totalXp = setoranXp + gradeBonusXp + mustamiXp + targetCompletedXp + achievementXp;

  // Determine Current Rank Level
  const defaultRank = activeRanks[0] || FALLBACK_RANKS[0]!;
  let currentRank: TeacherRank = defaultRank;
  let nextRank: TeacherRank = activeRanks[1] || defaultRank;

  for (let i = activeRanks.length - 1; i >= 0; i--) {
    const rank = activeRanks[i];
    if (rank && totalXp >= rank.minXp) {
      currentRank = rank;
      nextRank = activeRanks[i + 1] || rank;
      break;
    }
  }

  const currentLevelMin = currentRank?.minXp ?? 0;
  const nextLevelMin = nextRank?.minXp ?? currentLevelMin;
  const isMaxLevel = (currentRank?.level ?? 1) === (nextRank?.level ?? 1);

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
    targetCompletedCount: completedTargetsCount,
    achievementUnlockedCount: unlockedBadgesCount,
    completedTargetsCount,
    unlockedBadgesCount,
  };
}

const recentEvaluations = new Map<string, number>();

export function evaluateTeacherAchievements(teacherId: string): void {
  if (!teacherId) return;

  // Throttle evaluations to max once every 500ms per teacherId
  const now = Date.now();
  const lastEval = recentEvaluations.get(teacherId) || 0;
  if (now - lastEval < 500) return;
  recentEvaluations.set(teacherId, now);

  const teacherObj = teacherRepo.get(teacherId) || teacherRepo.list().find((t) => t.id === teacherId);
  const reports = reportRepo.list().filter((r) => r && !r.isDeleted);
  const targets = targetRepo.list().filter((t) => t && !t.isDeleted);
  const existingAchievements = achievementRepo.list().filter((a) => {
    if (!a || a.isDeleted) return false;
    if (a.teacherId === teacherId) return true;
    const nameNorm = normalizeNameForMatching(teacherObj?.name);
    if (nameNorm && normalizeNameForMatching(a.teacherId) === nameNorm) return true;
    return false;
  });

  const unlockedCodes = new Set(existingAchievements.map((a) => a.code));

  const currentMasterBadges = getActiveMasterBadges();

  if (teacherObj?.role === "upgrader" && !unlockedCodes.has("UPGRADER_MASTER")) {
    const def = currentMasterBadges.find((m) => m.code === "UPGRADER_MASTER");
    if (def) {
      const created = achievementRepo.create({
        teacherId,
        code: def.code,
        title: def.title,
        description: def.description,
        category: def.category,
        icon: def.icon,
        points: Number(def.points) || 0,
        unlockedAt: new Date().toISOString(),
      });
      pushMutationToGas("achievements", "create", created);
      unlockedCodes.add("UPGRADER_MASTER");
    }
  }

  const nameNorm = normalizeNameForMatching(teacherObj?.name);

  const teacherReports = reports.filter((r) => {
    if (!r || r.isDeleted) return false;
    if (r.teacherId === teacherId) return true;
    if (nameNorm && r.teacherName && normalizeNameForMatching(r.teacherName) === nameNorm) return true;
    return false;
  });
  const teacherTargets = targets.filter((t) => t && (t.teacherId === teacherId || (nameNorm && normalizeNameForMatching(t.teacherId) === nameNorm)) && !t.isDeleted);
  const teacherMustami = reports.filter((r) => {
    if (!r || r.isDeleted) return false;
    if (r.mustamiId === teacherId) return true;
    if (nameNorm && r.mustamiName && normalizeNameForMatching(r.mustamiName) === nameNorm) return true;
    return false;
  });

  const newToUnlock: AchievementDefinition[] = [];

  // Dynamic evaluation for all master badges defined in Google Spreadsheet catalog
  for (const def of currentMasterBadges) {
    if (!def || !def.code) continue;
    if (unlockedCodes.has(def.code)) continue;

    const cat = (def.category || "").toLowerCase();
    const codeUpper = (def.code || "").toUpperCase();
    const descLower = (def.description || "").toLowerCase();
    const titleLower = (def.title || "").toLowerCase();

    // Parse required count from description (e.g. "minimal 20x", "5 setoran", "3 target")
    const countMatch =
      descLower.match(/(\d+)\s*x/) ||
      descLower.match(/minimal\s*(\d+)/) ||
      descLower.match(/(\d+)\s*setoran/) ||
      descLower.match(/(\d+)\s*target/);
    const requiredCount = countMatch && countMatch[1] ? parseInt(countMatch[1], 10) : 1;

    let shouldUnlock = false;

    if (cat === "mustami" || codeUpper.includes("MUSTAMI") || titleLower.includes("mustami")) {
      if (teacherMustami.length >= requiredCount) {
        shouldUnlock = true;
      }
    } else if (cat === "target" || codeUpper.includes("TARGET") || titleLower.includes("target")) {
      const completedTargets = teacherTargets.filter((t) => t.status === "tercapai").length;
      if (completedTargets >= requiredCount) {
        shouldUnlock = true;
      }
    } else if (cat === "tahsin" || codeUpper.includes("TAHSIN") || titleLower.includes("matn")) {
      if (teacherReports.some((r) => r.material === "matn" && r.grade === "A")) {
        shouldUnlock = true;
      }
    } else if (cat === "setoran" || codeUpper.includes("SETORAN") || codeUpper.includes("GRADE_A")) {
      if (descLower.includes("nilai a") || descLower.includes("grade a") || codeUpper.includes("GRADE_A")) {
        const gradeACount = teacherReports.filter((r) => r.grade === "A").length;
        if (gradeACount >= (requiredCount > 1 ? requiredCount : 1)) {
          shouldUnlock = true;
        }
      } else {
        if (teacherReports.length >= requiredCount) {
          shouldUnlock = true;
        }
      }
    }

    if (shouldUnlock) {
      newToUnlock.push(def);
      unlockedCodes.add(def.code);
    }
  }

  // Award achievements and sync mutation to backend
  for (const def of newToUnlock) {
    if (!def) continue;
    const ach = achievementRepo.create({
      teacherId,
      code: def.code,
      title: def.title,
      description: def.description,
      category: def.category,
      icon: def.icon,
      points: Number(def.points) || 0,
      unlockedAt: new Date().toISOString(),
    });

    pushMutationToGas("achievements", "create", ach);

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

/** Evaluates achievements, XP, and Ranks for all active teachers */
export function evaluateAllTeachersAchievements(): void {
  const teachers = teacherRepo.list().filter((t) => t && !t.isDeleted);
  for (const t of teachers) {
    if (t && t.id) {
      evaluateTeacherAchievements(t.id);
    }
  }
}
