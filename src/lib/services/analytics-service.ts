import { activeReports, averageScore, materialLabel } from "@/lib/data/selectors";
import type { Grade, MaterialType, Report, Target, Teacher } from "@/lib/data/types";
import { calculateTeacherXpAndRank } from "./achievement-service";

export type TimeRange = "all" | "this_month" | "last_3_months" | "this_year";

export function filterReportsByTimeRange(reports: Report[], range: TimeRange): Report[] {
  const now = new Date();
  return reports.filter((r) => {
    if (r.isDeleted) return false;
    const rDate = new Date(r.date);

    if (range === "this_month") {
      return (
        rDate.getFullYear() === now.getFullYear() && rDate.getMonth() === now.getMonth()
      );
    }
    if (range === "last_3_months") {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      return rDate >= threeMonthsAgo;
    }
    if (range === "this_year") {
      return rDate.getFullYear() === now.getFullYear();
    }

    return true;
  });
}

export function computeInstitutionalAnalytics(
  allReports: Report[],
  allTargets: Target[],
  allTeachers: Teacher[],
  allAchievements: any[],
  timeRange: TimeRange = "all",
) {
  const reports = filterReportsByTimeRange(allReports, timeRange);
  const activeT = allTargets.filter((t) => !t.isDeleted);
  const activeTech = allTeachers.filter((t) => t.status === "aktif");

  const totalReports = reports.length;

  // Grade Distribution
  const gradeCounts: Record<Grade, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const r of reports) {
    if (gradeCounts[r.grade] !== undefined) {
      gradeCounts[r.grade]++;
    }
  }

  const gradePercentages = {
    A: totalReports > 0 ? Math.round((gradeCounts.A / totalReports) * 100) : 0,
    B: totalReports > 0 ? Math.round((gradeCounts.B / totalReports) * 100) : 0,
    C: totalReports > 0 ? Math.round((gradeCounts.C / totalReports) * 100) : 0,
    D: totalReports > 0 ? Math.round((gradeCounts.D / totalReports) * 100) : 0,
  };

  // Material Distribution
  const materialCounts: Record<MaterialType, number> = {
    tahfizh: 0,
    matn: 0,
    hadits: 0,
    lainnya: 0,
  };
  for (const r of reports) {
    if (materialCounts[r.material] !== undefined) {
      materialCounts[r.material]++;
    }
  }

  const avgInstitutionalScore = averageScore(reports) ?? 0;

  // Target statistics
  const totalTargets = activeT.length;
  const completedTargets = activeT.filter((t) => t.status === "tercapai").length;
  const targetCompletionRate =
    totalTargets > 0 ? Math.round((completedTargets / totalTargets) * 100) : 0;

  // PR Resolution Rate
  const totalHomeworks = reports.filter((r) => !!r.homework).length;
  const completedHomeworks = reports.filter((r) => !!r.homework && r.homeworkDone).length;
  const homeworkResolutionRate =
    totalHomeworks > 0 ? Math.round((completedHomeworks / totalHomeworks) * 100) : 0;

  // Monthly setoran trend (Last 6 months)
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
  const trendData: { month: string; count: number; avgScore: number }[] = [];

  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mYear = d.getFullYear();
    const mMonth = d.getMonth();

    const monthReports = allReports.filter((r) => {
      if (r.isDeleted) return false;
      const rd = new Date(r.date);
      return rd.getFullYear() === mYear && rd.getMonth() === mMonth;
    });

    const mAvg = averageScore(monthReports) ?? 0;

    trendData.push({
      month: `${monthNames[mMonth]} ${mYear.toString().slice(2)}`,
      count: monthReports.length,
      avgScore: mAvg,
    });
  }

  // Teacher Performance Table / Leaderboard
  const teacherLeaderboard = activeTech.map((t) => {
    const tReports = reports.filter((r) => r.teacherId === t.id);
    const tMustami = reports.filter((r) => r.mustamiId === t.id);
    const tTargets = activeT.filter((tgt) => tgt.teacherId === t.id);
    const tAvgScore = averageScore(tReports) ?? 0;
    const { totalXp, currentRank } = calculateTeacherXpAndRank(
      t.id,
      allReports,
      activeT,
      allAchievements,
    );

    return {
      teacher: t,
      setoranCount: tReports.length,
      mustamiCount: tMustami.length,
      avgScore: tAvgScore,
      completedTargets: tTargets.filter((tgt) => tgt.status === "tercapai").length,
      totalXp,
      rank: currentRank,
    };
  }).sort((a, b) => b.totalXp - a.totalXp);

  return {
    totalReports,
    totalTeachers: activeTech.length,
    avgInstitutionalScore,
    gradeCounts,
    gradePercentages,
    materialCounts,
    targetCompletionRate,
    completedTargets,
    totalTargets,
    homeworkResolutionRate,
    completedHomeworks,
    totalHomeworks,
    trendData,
    teacherLeaderboard,
  };
}

export function generateExecutiveSummaryMarkdown(analytics: ReturnType<typeof computeInstitutionalAnalytics>): string {
  return `### Ringkasan Evaluasi Upgrading Lembaga
**Griya Huffazh Quran**

* **Total Setoran Terverifikasi**: ${analytics.totalReports} setoran
* **Jumlah Pengajar Aktif**: ${analytics.totalTeachers} ustadz/ustadzah
* **Rata-rata Nilai Lembaga**: ${analytics.avgInstitutionalScore} / 100
* **Tingkat Tuntas Target Upgrading**: ${analytics.targetCompletionRate}% (${analytics.completedTargets}/${analytics.totalTargets} target)
* **Tingkat Tuntas PR/Tugas**: ${analytics.homeworkResolutionRate}% (${analytics.completedHomeworks}/${analytics.totalHomeworks} PR selesai)

#### Distribusi Nilai Setoran:
- **Predikat A (Mumtaz)**: ${analytics.gradeCounts.A} (${analytics.gradePercentages.A}%)
- **Predikat B (Jayyid Jiddan)**: ${analytics.gradeCounts.B} (${analytics.gradePercentages.B}%)
- **Predikat C (Jayyid)**: ${analytics.gradeCounts.C} (${analytics.gradePercentages.C}%)
- **Predikat D (Perlu Bimbingan)**: ${analytics.gradeCounts.D} (${analytics.gradePercentages.D}%)

#### Sebaran Materi Upgrading:
- **Tahfizh Al-Qur'an**: ${analytics.materialCounts.tahfizh} setoran
- **Matn**: ${analytics.materialCounts.matn} setoran
- **Hadits**: ${analytics.materialCounts.hadits} setoran
- **Lainnya**: ${analytics.materialCounts.lainnya} setoran
`;
}
