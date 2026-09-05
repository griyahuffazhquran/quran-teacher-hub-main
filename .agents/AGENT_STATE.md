# 🤖 AGENT_STATE.md — Griya Huffazh Quran Active State Tracker

## 📌 Project Operational Status

- **Status:** Active / Ready
- **Current Mode:** Agent Architecture Infrastructure & Discovery Complete
- **Project Name:** Griya Huffazh Quran — Teacher Upgrading Management System
- **Framework:** TanStack Start (React 19 + Vite + Tailwind CSS v4)
- **Primary Database Engine:** SQLite (`db/quran_teacher.db`) & Supabase Client Integration Active
- **Last Updated:** 2026-09-05

---

## 🎯 Task Progress Tracker

### ⏳ Current Phase / Active Task
- [x] Discovery & Analysis Repository lengkap (Tech stack, arsitektur, domain rules).
- [x] Pembentukan Fondasi Agentic Development `.agents/` lengkap (AGENT.md, PROJECT_CONTEXT.md, ARCHITECTURE.md, RULES.md, WORKFLOW.md, DECISIONS.md, AGENT_STATE.md).
- [x] Pembuatan Skill System Modular spesifik proyek (griya-huffazh-domain, tanstack-start-architecture, database-and-migration, whatsapp-connector, quality-and-verification, debugging-and-troubleshooting).
- [ ] Pengujian build & verifikasi kesiapan sistem agentik.

### 📜 Completed Milestones
- [x] **Phase 0:** Project Foundation & TanStack Router shell setup (`src/routes/*`).
- [x] **Phase 1:** Data Layer & Authentication (Role Teacher vs Upgrader, Session & Auth Service).
- [x] **Phase 2:** Teacher Management (Master Data Guru, CRUD, Status Active/Inactive).
- [x] **Phase 3:** Core Setoran Report & Reciprocal Assessment Logic (Teacher A assesses B, single entry updates both views).
- [x] **Phase 4:** Teacher Dashboard & Analytics Overview.
- [x] **Database Evolution:** Skema SQLite lokal + DDL Supabase PostgreSQL + Migration Script setup.
- [x] **Agent Infrastructure:** .agents system standardization.

---

## 🧠 Active Memory & Context Notes

- **Git Safety Rule:** Branch utama terhubung ke Lovable. Dilarang keras merewrite git history (`git push --force`, `rebase`, `commit --amend`).
- **Database Engine:** Mempertahankan SQLite lokal singleton (`src/lib/db/client.ts`) untuk kecepatan dev lokal, sambil menjaga kesiapan migrasi ke Supabase (`src/lib/config/supabase.ts`).
- **Reciprocity Guarantee:** Pembuatan setoran di `reports.tsx` WAJIB mengupdate *My Upgrading Progress* bagi peserta dan *My Assessment Activity* bagi mustami'.

---

## 📋 Recent Decisions & Architectural Notes
- **2026-09-05:** Pengadopsian standar `.agents/` komprehensif sebagai pusat pengetahuan agentic development proyek Griya Huffazh Quran.
- **2026-08-19:** Integrasi skill WhatsApp Connector untuk otomatisasi draf notifikasi setoran dari penguji ke peserta.
