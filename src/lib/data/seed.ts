import { nowISO } from "./storage";
import type { ActivityLog, NotificationItem, Report, Target, Teacher } from "./types";

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

export function seedTargets(): Target[] {
  return [
    {
      id: "tar_1",
      teacherId: "tea_ahmad",
      title: "Ziyadah 1 Juz",
      period: "bulanan",
      startDate: daysAgo(10),
      dueDate: daysAhead(20),
      targetValue: 20,
      currentValue: 12,
      unit: "halaman",
      ...stamp(),
    },
    {
      id: "tar_2",
      teacherId: "tea_hanifah",
      title: "Murojaah Juz 1-5",
      period: "semester",
      startDate: daysAgo(40),
      dueDate: daysAhead(60),
      targetValue: 100,
      currentValue: 55,
      unit: "halaman",
      ...stamp(),
    },
    {
      id: "tar_3",
      teacherId: "tea_ridwan",
      title: "Tahsin dasar tuntas",
      period: "bulanan",
      startDate: daysAgo(5),
      dueDate: daysAhead(25),
      targetValue: 8,
      currentValue: 2,
      unit: "sesi",
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
      ...stamp(),
    },
    {
      id: "not_2",
      title: "Target tercapai 50%",
      body: "Ustzh. Hanifah Salma mencapai 55 dari 100 halaman.",
      level: "info",
      read: false,
      ...stamp(),
    },
    {
      id: "not_3",
      title: "Setoran baru",
      body: "3 setoran tercatat pekan ini.",
      level: "success",
      read: true,
      ...stamp(),
    },
  ];
}

export function seedActivityLogs(): ActivityLog[] {
  return [];
}
