export type ID = string;

export type TeacherGender = "ustadz" | "ustadzah";
export type TeacherStatus = "aktif" | "nonaktif";
export type UserRole = "teacher" | "upgrader";

export type Teacher = {
  id: ID;
  name: string;
  gender: TeacherGender;
  status: TeacherStatus;
  phone?: string;
  level: string;
  joinedAt: string; // ISO date
  username?: string;
  role?: UserRole;
  position?: string;
  specialization?: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
};

/** Jenis materi setoran (Phase 3). */
export type MaterialType = "tahfizh" | "matn" | "hadits" | "lainnya";
export type Grade = "A" | "B" | "C" | "D";
export type ReportStatus = "selesai" | "perlu_perbaikan" | "pr_aktif";

/** Legacy (pre Phase 3) report type, kept for data migration only. */
export type LegacyReportType = "ziyadah" | "murojaah" | "tahsin";

export type Report = {
  id: ID;
  /** Guru yang dinilai (teacher being assessed). */
  teacherId: ID;
  /** Guru yang menyimak (mustami'). */
  mustamiId: ID;
  mustamiName: string;
  date: string; // ISO date
  material: MaterialType;
  materialDetail: string;
  /** Ayat / Hal. / Juz */
  reference: string;
  grade: Grade;
  /** Catatan PR */
  homework?: string;
  homeworkDone: boolean;
  /** Catatan Mustami' */
  mustamiNote?: string;
  status: ReportStatus;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: ID;
  createdBy?: ID;
  updatedBy?: ID;
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

export type FeedbackType = "mustami" | "upgrader";

export type Feedback = {
  id: ID;
  reportId: ID;
  authorId: ID;
  authorName: string;
  authorRole: UserRole;
  type: FeedbackType;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type ReportComment = {
  id: ID;
  reportId: ID;
  authorId: ID;
  authorName: string;
  authorRole?: UserRole;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type NotificationType =
  | "REPORT_CREATED"
  | "REPORT_UPDATED"
  | "FEEDBACK_CREATED"
  | "COMMENT_CREATED"
  | "TARGET_CREATED"
  | "TARGET_NEAR_DEADLINE"
  | "HOMEWORK_PENDING"
  | "ACHIEVEMENT_UNLOCKED"
  | "ANNOUNCEMENT_CREATED"
  | "SYSTEM";

export type NotificationItem = {
  id: ID;
  title: string;
  body: string;
  level: "info" | "warning" | "success";
  read: boolean;
  type?: NotificationType;
  /** Penerima notifikasi; kosong = semua pengguna. */
  userId?: ID;
  reportId?: ID;
  targetId?: ID;
  feedbackId?: ID;
  commentId?: ID;
  createdAt: string;
  updatedAt: string;
};

export type ActivityLog = {
  id: ID;
  action: string;
  description: string;
  actorId?: ID;
  actorName?: string;
  entity?: string;
  entityId?: ID;
  createdAt: string;
  updatedAt: string;
};

export type Entity =
  | Teacher
  | Report
  | Target
  | Feedback
  | ReportComment
  | NotificationItem
  | ActivityLog;

export type NewEntity<T extends { id: ID; createdAt: string; updatedAt: string }> = Omit<
  T,
  "id" | "createdAt" | "updatedAt"
>;
