import { notificationRepo, reportRepo, teacherRepo } from "@/lib/data/repositories";
import { parseDateToTimestamp } from "@/lib/data/selectors";
import { pushMutationToGas } from "./gas-api-service";

/**
 * Evaluates and triggers automatic notifications for all teachers:
 * 1. Daily 13.00 WIB reminder for teachers who haven't submitted today.
 * 2. Inactivity reminder at 2 days (Setoran or Mustami').
 * 3. Inactivity reminder at 4 days (Setoran or Mustami').
 * 4. Inactivity reminder at 6+ days (Educative, Motivational & Open Discussion).
 */
export function evaluateAutomaticNotifications(): void {
  const teachers = teacherRepo.list().filter((t) => t && !t.isDeleted);
  const reports = reportRepo.list().filter((r) => r && !r.isDeleted);
  const existingNotifs = notificationRepo.list().filter(Boolean);

  const now = new Date();
  const currentHour = now.getHours();
  const todayYmd = now.toISOString().slice(0, 10);
  const nowMs = now.getTime();

  for (const teacher of teachers) {
    if (!teacher.id) continue;

    const rawTeacherName = String(teacher.name || "").trim();
    const nameCall = rawTeacherName ? ` ${rawTeacherName}` : "";

    // Find all activities for this teacher (both setoran as teacher & mustami as tester)
    const teacherReports = reports.filter((r) => {
      const isTeacher = r.teacherId === teacher.id;
      const isMustami = r.mustamiId === teacher.id;
      return isTeacher || isMustami;
    });

    let latestActivityMs = 0;
    let submittedToday = false;

    for (const r of teacherReports) {
      const timeMs = parseDateToTimestamp(r.date || r.createdAt);
      if (timeMs > latestActivityMs) {
        latestActivityMs = timeMs;
      }
      if (timeMs > 0) {
        const d = new Date(timeMs);
        if (d.toISOString().slice(0, 10) === todayYmd) {
          if (r.teacherId === teacher.id) {
            submittedToday = true;
          }
        }
      }
    }

    // Days since last activity (setoran OR mustami)
    const daysInactive = latestActivityMs > 0
      ? Math.floor((nowMs - latestActivityMs) / (1000 * 60 * 60 * 24))
      : 7; // If no activity ever, treat as >= 6 days

    // ------------------------------------------------------------------------
    // Rule 1: Daily 13.00 WIB Reminder for non-submitted teachers
    // ------------------------------------------------------------------------
    if (currentHour >= 13 && !submittedToday) {
      const title = "⏰ Pengingat Setoran Hari Ini (13.00 WIB)";
      const alreadySent = existingNotifs.some(
        (n) => n.userId === teacher.id && n.title === title && (n.createdAt || "").startsWith(todayYmd),
      );
      if (!alreadySent) {
        const item = notificationRepo.create({
          userId: teacher.id,
          title,
          body: `Assalamu'alaikum Ustaz/Ustazah${nameCall}. Pengingat harian jam 13.00 WIB: Anda belum melakukan setoran upgrading hari ini. Yuk sempatkan waktu sejenak untuk menyetorkan hafalan/materi ke penguji!`,
          level: "warning",
          type: "REMINDER_TRIGGERED",
          read: false,
        });
        pushMutationToGas("notifications", "create", item);
      }
    }

    // ------------------------------------------------------------------------
    // Rule 2: 2 Days of Inactivity
    // ------------------------------------------------------------------------
    if (daysInactive === 2) {
      const title = "📌 Pengingat Keistiqomahan (2 Hari)";
      const alreadySent = existingNotifs.some(
        (n) => n.userId === teacher.id && n.title === title && (n.createdAt || "").startsWith(todayYmd),
      );
      if (!alreadySent) {
        const item = notificationRepo.create({
          userId: teacher.id,
          title,
          body: `Assalamu'alaikum Ustaz/Ustazah${nameCall}. Sudah 2 hari belum ada aktivitas setoran maupun menyimak (mustami'). Mari jaga keistiqomahan harian upgrading Anda!`,
          level: "info",
          type: "REMINDER_TRIGGERED",
          read: false,
        });
        pushMutationToGas("notifications", "create", item);
      }
    }

    // ------------------------------------------------------------------------
    // Rule 3: 4 Days of Inactivity
    // ------------------------------------------------------------------------
    if (daysInactive === 4) {
      const title = "⚠️ Evaluasi Keistiqomahan (4 Hari)";
      const alreadySent = existingNotifs.some(
        (n) => n.userId === teacher.id && n.title === title && (n.createdAt || "").startsWith(todayYmd),
      );
      if (!alreadySent) {
        const item = notificationRepo.create({
          userId: teacher.id,
          title,
          body: `Assalamu'alaikum Ustaz/Ustazah${nameCall}. Sudah 4 hari tidak ada catatan setoran atau menyimak. Mari luangkan waktu sejenak untuk murojaah dan menyetor hafalan.`,
          level: "warning",
          type: "REMINDER_TRIGGERED",
          read: false,
        });
        pushMutationToGas("notifications", "create", item);
      }
    }

    // ------------------------------------------------------------------------
    // Rule 4: 6+ Days of Inactivity (Educative, Motivational & Open Discussion)
    // ------------------------------------------------------------------------
    if (daysInactive >= 6) {
      const title = "💬 Pendampingan & Motivasi Upgrading (6 Hari)";
      const alreadySent = existingNotifs.some(
        (n) => n.userId === teacher.id && n.title === title && (n.createdAt || "").startsWith(todayYmd),
      );
      if (!alreadySent) {
        const item = notificationRepo.create({
          userId: teacher.id,
          title,
          body: `Assalamu'alaikum Warahmatullahi Wabarakatuh, Ustaz/Ustazah${nameCall} yang dirahmati Allah Subhanahu wa Ta'ala.\n\nSudah ${daysInactive} hari tidak ada aktivitas setoran hafalan maupun menyimak. Kami sangat memahami bahwa kesibukan mengajar, keluarga, dan amanah lainnya bisa menjadi tantangan tersendiri.\n\nRasulullah shallallahu 'alaihi wa sallam bersabda bahwa amalan yang paling dicintai Allah adalah amalan yang kontinyu (istiqomah) walaupun sedikit. Apabila Ustaz/Ustazah mengalami kendala (kesulitan waktu, kesehatan, materi, atau hal lainnya), pintu diskusi selalu terbuka lebar bersama pengurus/upgrader. Mari saling menguatkan dan melanjutkan kembali kebaikan ini!`,
          level: "warning",
          type: "REMINDER_TRIGGERED",
          read: false,
        });
        pushMutationToGas("notifications", "create", item);
      }
    }
  }
}
