import { nowISO } from "./storage";
import type { NotificationItem, Report, Target, Teacher } from "./types";

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
      name: "Ust. Ridwan Hakim",
      gender: "ustadz",
      status: "aktif",
      level: "Juz 5",
      joinedAt: daysAgo(120),
      ...stamp(),
    },
    {
      id: "tea_maryam",
      name: "Ustzh. Maryam Azzahra",
      gender: "ustadzah",
      status: "nonaktif",
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
      teacherId: "tea_ahmad",
      date: daysAgo(1),
      type: "ziyadah",
      surah: "Al-Baqarah",
      fromAyah: 1,
      toAyah: 20,
      mustamiName: "Ust. Abdul Karim",
      score: 92,
      note: "Makhraj baik, perlu perbaikan mad.",
      homework: "Ulangi ayat 15-20",
      homeworkDone: false,
      ...stamp(),
    },
    {
      id: "rep_2",
      teacherId: "tea_hanifah",
      date: daysAgo(3),
      type: "murojaah",
      surah: "An-Nisa",
      fromAyah: 30,
      toAyah: 60,
      mustamiName: "Ustzh. Fatimah",
      score: 85,
      homeworkDone: true,
      ...stamp(),
    },
    {
      id: "rep_3",
      teacherId: "tea_ridwan",
      date: daysAgo(6),
      type: "tahsin",
      surah: "Al-Mulk",
      fromAyah: 1,
      toAyah: 15,
      mustamiName: "Ust. Abdul Karim",
      score: 78,
      note: "Perlu latihan ghunnah.",
      homework: "Latihan ghunnah 10 menit/hari",
      homeworkDone: false,
      ...stamp(),
    },
    {
      id: "rep_4",
      teacherId: "tea_ahmad",
      date: daysAgo(12),
      type: "murojaah",
      surah: "Yasin",
      fromAyah: 1,
      toAyah: 40,
      mustamiName: "Ustzh. Fatimah",
      score: 88,
      homeworkDone: true,
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
