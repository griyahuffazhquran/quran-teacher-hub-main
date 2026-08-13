export type ID = string;

export type TeacherGender = "ustadz" | "ustadzah";
export type TeacherStatus = "aktif" | "nonaktif";

export type Teacher = {
  id: ID;
  name: string;
  gender: TeacherGender;
  status: TeacherStatus;
  phone?: string;
  level: string;
  joinedAt: string; // ISO date
  createdAt: string;
  updatedAt: string;
};

export type ReportType = "ziyadah" | "murojaah" | "tahsin";

export type Report = {
  id: ID;
  teacherId: ID;
  date: string; // ISO date
  type: ReportType;
  surah: string;
  fromAyah: number;
  toAyah: number;
  mustamiName: string;
  score: number; // 0-100
  note?: string;
  homework?: string;
  homeworkDone: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TargetPeriod = "bulanan" | "semester" | "tahunan";

export type Target = {
  id: ID;
  teacherId: ID;
  title: string;
  period: TargetPeriod;
  startDate: string;
  dueDate: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
};

export type NotificationItem = {
  id: ID;
  title: string;
  body: string;
  level: "info" | "warning" | "success";
  read: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Entity = Teacher | Report | Target | NotificationItem;

export type NewEntity<T extends { id: ID; createdAt: string; updatedAt: string }> = Omit<
  T,
  "id" | "createdAt" | "updatedAt"
>;
