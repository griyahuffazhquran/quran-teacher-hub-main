-- Enable Row Level Security (RLS) and add public policies for Supabase Data API access

-- 1. Teachers
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access teachers" ON teachers;
CREATE POLICY "Public access teachers" ON teachers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 2. Reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access reports" ON reports;
CREATE POLICY "Public access reports" ON reports FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 3. Targets
ALTER TABLE targets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access targets" ON targets;
CREATE POLICY "Public access targets" ON targets FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 4. Reminders
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access reminders" ON reminders;
CREATE POLICY "Public access reminders" ON reminders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 5. Feedbacks
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access feedbacks" ON feedbacks;
CREATE POLICY "Public access feedbacks" ON feedbacks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 6. Report Comments
ALTER TABLE report_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access report_comments" ON report_comments;
CREATE POLICY "Public access report_comments" ON report_comments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 7. Achievements
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access achievements" ON achievements;
CREATE POLICY "Public access achievements" ON achievements FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 8. Announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access announcements" ON announcements;
CREATE POLICY "Public access announcements" ON announcements FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 9. Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access notifications" ON notifications;
CREATE POLICY "Public access notifications" ON notifications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 10. Activity Logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access activity_logs" ON activity_logs;
CREATE POLICY "Public access activity_logs" ON activity_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 11. Master Badges
ALTER TABLE master_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access master_badges" ON master_badges;
CREATE POLICY "Public access master_badges" ON master_badges FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 12. Teacher Ranks
ALTER TABLE teacher_ranks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access teacher_ranks" ON teacher_ranks;
CREATE POLICY "Public access teacher_ranks" ON teacher_ranks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 13. XP Config
ALTER TABLE xp_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access xp_config" ON xp_config;
CREATE POLICY "Public access xp_config" ON xp_config FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 14. Password Resets
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access password_resets" ON password_resets;
CREATE POLICY "Public access password_resets" ON password_resets FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 15. User Presence
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access user_presence" ON user_presence;
CREATE POLICY "Public access user_presence" ON user_presence FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
