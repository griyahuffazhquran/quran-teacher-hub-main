-- SQLite Schema for Griya Huffazh Learn (PostgreSQL-Ready Structure for Supabase Migration)

-- 1. Teachers Table
CREATE TABLE IF NOT EXISTS teachers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('ustadz', 'ustadzah')) NOT NULL,
    status TEXT CHECK (status IN ('aktif', 'nonaktif')) DEFAULT 'aktif' NOT NULL,
    phone TEXT,
    level TEXT NOT NULL,
    joined_at TEXT NOT NULL,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT CHECK (role IN ('teacher', 'upgrader')) DEFAULT 'teacher' NOT NULL,
    position TEXT,
    specialization TEXT,
    photo_url TEXT,
    is_deleted INTEGER DEFAULT 0 NOT NULL,
    deleted_at TEXT,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL,
    updated_at TEXT DEFAULT (datetime('now')) NOT NULL
);

-- 2. Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    mustami_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
    mustami_name TEXT NOT NULL,
    date TEXT NOT NULL,
    material TEXT CHECK (material IN ('tahfizh', 'murajaah', 'matn', 'hadits', 'lainnya')) NOT NULL,
    material_detail TEXT NOT NULL,
    reference TEXT NOT NULL,
    grade TEXT CHECK (grade IN ('A', 'B', 'C', 'D')) NOT NULL,
    homework TEXT,
    homework_done INTEGER DEFAULT 0 NOT NULL,
    mustami_note TEXT,
    status TEXT CHECK (status IN ('selesai', 'perlu_perbaikan', 'pr_aktif')) NOT NULL,
    is_deleted INTEGER DEFAULT 0 NOT NULL,
    deleted_at TEXT,
    deleted_by TEXT REFERENCES teachers(id),
    created_by TEXT REFERENCES teachers(id),
    updated_by TEXT REFERENCES teachers(id),
    created_at TEXT DEFAULT (datetime('now')) NOT NULL,
    updated_at TEXT DEFAULT (datetime('now')) NOT NULL
);

-- 3. Targets Table
CREATE TABLE IF NOT EXISTS targets (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    period TEXT CHECK (period IN ('bulanan', 'semester', 'tahunan')) NOT NULL,
    status TEXT CHECK (status IN ('aktif', 'tercapai', 'gagal')) DEFAULT 'aktif' NOT NULL,
    start_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    target_value INTEGER NOT NULL,
    current_value INTEGER DEFAULT 0 NOT NULL,
    unit TEXT NOT NULL,
    created_by TEXT REFERENCES teachers(id),
    is_deleted INTEGER DEFAULT 0 NOT NULL,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL,
    updated_at TEXT DEFAULT (datetime('now')) NOT NULL
);

-- 4. Reminders Table
CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    target_id TEXT NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
    teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    frequency TEXT CHECK (frequency IN ('once', 'daily', 'weekly')) NOT NULL,
    remind_at TEXT NOT NULL,
    dismissed INTEGER DEFAULT 0 NOT NULL,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL,
    updated_at TEXT DEFAULT (datetime('now')) NOT NULL
);

-- 5. Feedbacks Table
CREATE TABLE IF NOT EXISTS feedbacks (
    id TEXT PRIMARY KEY,
    report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    author_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_role TEXT CHECK (author_role IN ('teacher', 'upgrader')) NOT NULL,
    type TEXT CHECK (type IN ('mustami', 'upgrader')) NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL,
    updated_at TEXT DEFAULT (datetime('now')) NOT NULL
);

-- 6. Report Comments Table
CREATE TABLE IF NOT EXISTS report_comments (
    id TEXT PRIMARY KEY,
    report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    author_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_role TEXT CHECK (author_role IN ('teacher', 'upgrader')),
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL,
    updated_at TEXT DEFAULT (datetime('now')) NOT NULL
);

-- 7. Achievements Table
CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT CHECK (category IN ('umum', 'setoran', 'target', 'mustami', 'tahsin', 'level')) NOT NULL,
    icon TEXT NOT NULL,
    points INTEGER DEFAULT 0 NOT NULL,
    unlocked_at TEXT NOT NULL,
    is_deleted INTEGER DEFAULT 0 NOT NULL,
    deleted_at TEXT,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL,
    updated_at TEXT DEFAULT (datetime('now')) NOT NULL
);

-- 8. Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    pinned INTEGER DEFAULT 0 NOT NULL,
    audience TEXT CHECK (audience IN ('all', 'teachers', 'upgraders')) DEFAULT 'all' NOT NULL,
    due_date TEXT,
    is_deleted INTEGER DEFAULT 0 NOT NULL,
    deleted_at TEXT,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL,
    updated_at TEXT DEFAULT (datetime('now')) NOT NULL
);

-- 9. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    level TEXT CHECK (level IN ('info', 'warning', 'success')) DEFAULT 'info' NOT NULL,
    read INTEGER DEFAULT 0 NOT NULL,
    type TEXT,
    user_id TEXT REFERENCES teachers(id) ON DELETE CASCADE,
    report_id TEXT REFERENCES reports(id) ON DELETE SET NULL,
    target_id TEXT REFERENCES targets(id) ON DELETE SET NULL,
    feedback_id TEXT REFERENCES feedbacks(id) ON DELETE SET NULL,
    comment_id TEXT REFERENCES report_comments(id) ON DELETE SET NULL,
    reminder_id TEXT REFERENCES reminders(id) ON DELETE SET NULL,
    achievement_id TEXT REFERENCES achievements(id) ON DELETE SET NULL,
    announcement_id TEXT REFERENCES announcements(id) ON DELETE SET NULL,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL,
    updated_at TEXT DEFAULT (datetime('now')) NOT NULL
);

-- 10. Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    description TEXT NOT NULL,
    actor_id TEXT REFERENCES teachers(id) ON DELETE SET NULL,
    actor_name TEXT,
    entity TEXT,
    entity_id TEXT,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL,
    updated_at TEXT DEFAULT (datetime('now')) NOT NULL
);

-- 11. Master Badges Table
CREATE TABLE IF NOT EXISTS master_badges (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'setoran',
    icon TEXT DEFAULT 'Award',
    points INTEGER DEFAULT 0 NOT NULL,
    is_deleted INTEGER DEFAULT 0 NOT NULL,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL,
    updated_at TEXT DEFAULT (datetime('now')) NOT NULL
);

-- 12. Teacher Ranks Table
CREATE TABLE IF NOT EXISTS teacher_ranks (
    id TEXT PRIMARY KEY,
    level INTEGER NOT NULL,
    title TEXT NOT NULL,
    min_xp INTEGER DEFAULT 0 NOT NULL,
    badge TEXT DEFAULT '🌱' NOT NULL,
    color TEXT DEFAULT 'text-slate-500' NOT NULL,
    is_deleted INTEGER DEFAULT 0 NOT NULL,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL,
    updated_at TEXT DEFAULT (datetime('now')) NOT NULL
);

-- 13. XP Config Table
CREATE TABLE IF NOT EXISTS xp_config (
    id TEXT PRIMARY KEY,
    xp_per_setoran INTEGER DEFAULT 30 NOT NULL,
    bonus_grade_a INTEGER DEFAULT 20 NOT NULL,
    xp_per_mustami INTEGER DEFAULT 25 NOT NULL,
    xp_per_target INTEGER DEFAULT 100 NOT NULL,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL,
    updated_at TEXT DEFAULT (datetime('now')) NOT NULL
);

-- 14. Password Resets Table
CREATE TABLE IF NOT EXISTS password_resets (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    requested_at TEXT NOT NULL,
    status TEXT DEFAULT 'Pending' NOT NULL,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL,
    updated_at TEXT DEFAULT (datetime('now')) NOT NULL
);

-- 15. User Presence Table
CREATE TABLE IF NOT EXISTS user_presence (
    user_id TEXT PRIMARY KEY REFERENCES teachers(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_role TEXT DEFAULT 'teacher' NOT NULL,
    gender TEXT,
    position TEXT,
    current_path TEXT DEFAULT '/' NOT NULL,
    device_info TEXT DEFAULT 'HP / Tablet' NOT NULL,
    status TEXT DEFAULT 'online' NOT NULL,
    last_seen_at INTEGER NOT NULL,
    updated_at TEXT DEFAULT (datetime('now')) NOT NULL
);

-- Performance & Indexing
CREATE INDEX IF NOT EXISTS idx_teachers_username ON teachers(username);
CREATE INDEX IF NOT EXISTS idx_reports_teacher_id ON reports(teacher_id);
CREATE INDEX IF NOT EXISTS idx_reports_mustami_id ON reports(mustami_id);
CREATE INDEX IF NOT EXISTS idx_reports_date ON reports(date);
CREATE INDEX IF NOT EXISTS idx_targets_teacher_id ON targets(teacher_id);
CREATE INDEX IF NOT EXISTS idx_reminders_teacher_id ON reminders(teacher_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_report_id ON feedbacks(report_id);
CREATE INDEX IF NOT EXISTS idx_report_comments_report_id ON report_comments(report_id);
CREATE INDEX IF NOT EXISTS idx_achievements_teacher_id ON achievements(teacher_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor_id ON activity_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_master_badges_code ON master_badges(code);
CREATE INDEX IF NOT EXISTS idx_teacher_ranks_level ON teacher_ranks(level);
CREATE INDEX IF NOT EXISTS idx_password_resets_username ON password_resets(username);
