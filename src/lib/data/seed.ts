import { nowISO } from "./storage";
import type {
  ActivityLog,
  Feedback,
  NotificationItem,
  Reminder,
  Report,
  ReportComment,
  Target,
  Teacher,
} from "./types";

const stamp = () => ({ createdAt: nowISO(), updatedAt: nowISO() });

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function daysAhead(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function seedTeachers(): Teacher[] {
  return [
    {
      id: "tea_ahmad",
      username: "ahmad.fauzan",
      role: "teacher",
      position: "Guru Tahfizh Senior",
      specialization: "Tahfizh Al-Qur'an",
      name: "Ust. Ahmad Fauzan",
      gender: "ustadz",
      status: "aktif",
      phone: "0812-1111-2222",
      level: "Juz 20",
      joinedAt: daysAgo(400),
      ...stamp(),
    },
    {
      id: "tea_hanifah",
      username: "hanifah.salma",
      role: "teacher",
      position: "Guru Tahfizh",
      specialization: "Tahsin & Tajwid",
      name: "Ustzh. Hanifah Salma",
      gender: "ustadzah",
      status: "aktif",
      phone: "0813-3333-4444",
      level: "Juz 12",
      joinedAt: daysAgo(260),
      ...stamp(),
    },
    {
      id: "tea_ridwan",
      username: "ridwan.hakim",
      role: "teacher",
      position: "Guru Matn",
      specialization: "Matn & Hadits",
      name: "Ust. Ridwan Hakim",
      gender: "ustadz",
      status: "aktif",
      level: "Juz 5",
      joinedAt: daysAgo(120),
      ...stamp(),
    },
    {
      id: "tea_abdullah",
      username: "abdullah.karim",
      role: "teacher",
      position: "Guru Tahfizh",
      specialization: "Tahfizh Al-Qur'an",
      name: "Ust. Abdullah Karim",
      gender: "ustadz",
      status: "aktif",
      phone: "0814-5555-6666",
      level: "Juz 15",
      joinedAt: daysAgo(300),
      ...stamp(),
    },
    {
      id: "tea_maryam",
      username: "maryam.azzahra",
      role: "upgrader",
      position: "Koordinator Upgrading",
      specialization: "Tahfizh Al-Qur'an",
      name: "Ustzh. Maryam Azzahra",
      gender: "ustadzah",
      status: "aktif",
      level: "Juz 8",
      joinedAt: daysAgo(700),
      ...stamp(),
    },
  ];
}

export function seedReports(): Report[] {
  return [
    {
      id: "rep_1",
      teacherId: "tea_abdullah",
      mustamiId: "tea_ahmad",
      mustamiName: "Ust. Ahmad Fauzan",
      date: daysAgo(1),
      material: "tahfizh",
      materialDetail: "Ziyadah Al-Baqarah",
      reference: "QS. Al-Baqarah 1-20",
      grade: "A",
      mustamiNote: "Makhraj baik, perlu perbaikan mad.",
      homework: "Ulangi ayat 15-20",
      homeworkDone: false,
      status: "pr_aktif",
      createdBy: "tea_ahmad",
      ...stamp(),
    },
    {
      id: "rep_2",
      teacherId: "tea_hanifah",
      mustamiId: "tea_maryam",
      mustamiName: "Ustzh. Maryam Azzahra",
      date: daysAgo(3),
      material: "tahfizh",
      materialDetail: "Murojaah An-Nisa",
      reference: "QS. An-Nisa 30-60",
      grade: "B",
      homeworkDone: true,
      status: "selesai",
      createdBy: "tea_maryam",
      ...stamp(),
    },
    {
      id: "rep_3",
      teacherId: "tea_ridwan",
      mustamiId: "tea_ahmad",
      mustamiName: "Ust. Ahmad Fauzan",
      date: daysAgo(6),
      material: "matn",
      materialDetail: "Matn Al-Jazariyah",
      reference: "Hal. 4-8",
      grade: "C",
      mustamiNote: "Perlu latihan ghunnah.",
      homework: "Latihan ghunnah 10 menit/hari",
      homeworkDone: false,
      status: "pr_aktif",
      createdBy: "tea_ahmad",
      ...stamp(),
    },
    {
      id: "rep_4",
      teacherId: "tea_ahmad",
      mustamiId: "tea_abdullah",
      mustamiName: "Ust. Abdullah Karim",
      date: daysAgo(12),
      material: "hadits",
      materialDetail: "Arbain Nawawi",
      reference: "Hadits 1-5",
      grade: "B",
      homeworkDone: true,
      status: "selesai",
      createdBy: "tea_abdullah",
      ...stamp(),
    },
  ];
}

export function seedFeedbacks(): Feedback[] {
  return [
    {
      id: "fb_1",
      reportId: "rep_1",
      authorId: "tea_ahmad",
      authorName: "Ust. Ahmad Fauzan",
      authorRole: "teacher",
      type: "mustami",
      content: "Fokus pada kelancaran mad thobi'i di ayat 18 dan perhatikan waqaf ibtida'.",
      ...stamp(),
    },
    {
      id: "fb_2",
      reportId: "rep_1",
      authorId: "tea_maryam",
      authorName: "Ustzh. Maryam Azzahra",
      authorRole: "upgrader",
      type: "upgrader",
      content: "Progres sangat baik! Pertahankan konsistensi setoran harian.",
      ...stamp(),
    },
  ];
}

export function seedComments(): ReportComment[] {
  return [
    {
      id: "com_1",
      reportId: "rep_1",
      authorId: "tea_abdullah",
      authorName: "Ust. Abdullah Karim",
      authorRole: "teacher",
      content: "Jazakallahu khairan Ustadz atas koreksinya. PR ayat 15-20 sudah saya ulang kembali.",
      ...stamp(),
    },
    {
      id: "com_2",
      reportId: "rep_1",
      authorId: "tea_ahmad",
      authorName: "Ust. Ahmad Fauzan",
      authorRole: "teacher",
      content: "Barakallahu fiik, insyaAllah besok kita simak kembali kelanjutannya.",
      ...stamp(),
    },
  ];
}

export function seedTargets(): Target[] {
  return [
    {
      id: "tar_1",
      teacherId: "tea_ahmad",
      title: "Ziyadah 1 Juz (Juz 21)",
      description: "Menyelesaikan ziyadah hafalan 1 juz penuh untuk bulan ini.",
      period: "bulanan",
      status: "aktif",
      startDate: daysAgo(10),
      dueDate: daysAhead(20),
      targetValue: 20,
      currentValue: 12,
      unit: "halaman",
      createdBy: "tea_maryam",
      ...stamp(),
    },
    {
      id: "tar_2",
      teacherId: "tea_hanifah",
      title: "Murojaah Juz 1-5",
      description: "Kelancaran murojaah 5 juz pertama tanpa kesalahan makhraj.",
      period: "semester",
      status: "aktif",
      startDate: daysAgo(40),
      dueDate: daysAhead(60),
      targetValue: 100,
      currentValue: 55,
      unit: "halaman",
      createdBy: "tea_maryam",
      ...stamp(),
    },
    {
      id: "tar_3",
      teacherId: "tea_ridwan",
      title: "Tahsin dasar tuntas",
      description: "Ujian kelayakan tajwid dasar dan matn Jazariyah.",
      period: "bulanan",
      status: "aktif",
      startDate: daysAgo(5),
      dueDate: daysAhead(25),
      targetValue: 8,
      currentValue: 2,
      unit: "sesi",
      createdBy: "tea_maryam",
      ...stamp(),
    },
    {
      id: "tar_4",
      teacherId: "tea_abdullah",
      title: "Setoran Mutqin Juz 15",
      description: "Setoran sekali duduk Juz 15 dengan nilai minimal A.",
      period: "bulanan",
      status: "tercapai",
      startDate: daysAgo(30),
      dueDate: daysAgo(2),
      targetValue: 20,
      currentValue: 20,
      unit: "halaman",
      createdBy: "tea_maryam",
      ...stamp(),
    },
  ];
}

export function seedReminders(): Reminder[] {
  return [
    {
      id: "rem_1",
      targetId: "tar_1",
      teacherId: "tea_ahmad",
      title: "Pengingat Target Ziyadah",
      message: "Setoran Ziyadah Juz 21 tinggal 8 halaman lagi. Jangan lupa setoran ke Ustzh. Maryam!",
      frequency: "weekly",
      remindAt: daysAhead(2),
      dismissed: false,
      ...stamp(),
    },
    {
      id: "rem_2",
      targetId: "tar_3",
      teacherId: "tea_ridwan",
      title: "Pengingat Evaluasi Tahsin",
      message: "Sesi tahsin dasar ke-3 dijadwalkan besok jam 09.00 WIB.",
      frequency: "once",
      remindAt: daysAhead(1),
      dismissed: false,
      ...stamp(),
    },
  ];
}

export function seedNotifications(): NotificationItem[] {
  return [
    {
      id: "not_1",
      title: "PR belum selesai",
      body: "Ust. Ahmad Fauzan memiliki PR yang belum diselesaikan.",
      level: "warning",
      read: false,
      type: "HOMEWORK_PENDING",
      reportId: "rep_1",
      ...stamp(),
    },
    {
      id: "not_2",
      title: "Feedback Baru dari Upgrader",
      body: "Ustzh. Maryam Azzahra memberikan catatan evaluasi upgrading pada setoran QS. Al-Baqarah 1-20.",
      level: "info",
      read: false,
      type: "FEEDBACK_CREATED",
      reportId: "rep_1",
      ...stamp(),
    },
    {
      id: "not_3",
      title: "Setoran baru",
      body: "Ust. Ahmad Fauzan menyimak setoran Ziyadah Al-Baqarah Anda.",
      level: "success",
      read: true,
      type: "REPORT_CREATED",
      reportId: "rep_1",
      ...stamp(),
    },
  ];
}

export function seedActivityLogs(): ActivityLog[] {
  return [
    {
      id: "act_1",
      action: "REPORT_CREATED",
      description: "Ust. Ahmad Fauzan membuat setoran Ziyadah Al-Baqarah untuk Ust. Abdullah Karim.",
      actorId: "tea_ahmad",
      actorName: "Ust. Ahmad Fauzan",
      entity: "reports",
      entityId: "rep_1",
      ...stamp(),
    },
    {
      id: "act_2",
      action: "FEEDBACK_CREATED",
      description: "Ustzh. Maryam Azzahra memberikan feedback resmi untuk setoran Ust. Abdullah Karim.",
      actorId: "tea_maryam",
      actorName: "Ustzh. Maryam Azzahra",
      entity: "feedbacks",
      entityId: "fb_2",
      ...stamp(),
    },
    {
      id: "act_3",
      action: "COMMENT_CREATED",
      description: "Ust. Abdullah Karim mengirim komentar pada setoran QS. Al-Baqarah 1-20.",
      actorId: "tea_abdullah",
      actorName: "Ust. Abdullah Karim",
      entity: "comments",
      entityId: "com_1",
      ...stamp(),
    },
  ];
}
