# 🏗️ ARCHITECTURE.md — Griya Huffazh Quran Architecture Specification

## 🌌 System Architecture Overview

Proyek ini dibangun menggunakan arsitektur **TanStack Start Fullstack React Application** (dengan Vite, React 19, dan Nitro bundler target).

Arsitektur data bersifat **Hybrid Storage Ready**:
1. **Local Development DB Engine:** SQLite via `better-sqlite3` (`db/quran_teacher.db`), diakses melalui helper singleton `src/lib/db/client.ts`.
2. **Cloud Migration Target:** Supabase PostgreSQL (`db/supabase-schema.sql`), dikonfigurasi melalui `src/lib/config/supabase.ts`.
3. **Legacy Sync Layer:** Google Apps Script (`google-apps-script-clean.gs` & `src/lib/services/gas-api-service.ts`).
4. **Fallback Local Cache:** LocalStorage Client Services (`src/lib/services/*`).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                              │
│  src/routes/*.tsx  (TanStack File-based Router + Radix UI + Tailwind) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                         APPLICATION SERVICE LAYER                      │
│  src/lib/services/*.ts  (ReportService, TeacherService, AuthService)  │
└───────┬───────────────────────────┬────────────────────────────┬───────┘
        │                           │                            │
┌───────▼─────────────┐     ┌───────▼─────────────┐     ┌────────▼───────┐
│ SQLite Local Engine │     │ Supabase JS Engine  │     │ Google Apps    │
│ (src/lib/db/client) │     │ (src/lib/config/sb) │     │ Script Sync    │
└─────────────────────┘     └─────────────────────┘     └────────────────┘
```

---

## 📂 Directory & File Structure

```
quran-teacher-hub-main/
├── .agents/                    # Pusat Pengetahuan & Rule AI Agent (Project Authority)
│   ├── AGENT.md                # Entry point utama agent & aturan tata kelola
│   ├── PROJECT_CONTEXT.md      # Konteks proyek, domain, & glosarium
│   ├── ARCHITECTURE.md         # Spesifikasi arsitektur teknis
│   ├── RULES.md                # Guardrails & aturan perubahan ketat
│   ├── WORKFLOW.md             # Prosedur kerja step-by-step
│   ├── AGENT_STATE.md          # State tracker & memori kerja
│   ├── DECISIONS.md            # Decision Log / ADR (Architecture Decision Records)
│   └── skills/                 # Skill modular (domain, tanstack, db, wa, quality, debug)
├── db/                         # Skema database & script migrasi
│   ├── quran_teacher.db        # SQLite database file lokal
│   ├── schema.sql              # DDL skema SQLite lokal
│   ├── seed.sql                # Data awal/seed SQLite
│   ├── supabase-schema.sql     # Skema DDL Supabase PostgreSQL & RLS Policies
│   ├── migrate-to-supabase.ts  # Script migrasi data SQLite ke Supabase
│   └── import-gas-to-sqlite.ts # Script sinkronisasi Google Apps Script ke SQLite
├── src/                        # Source code aplikasi utama
│   ├── backend/                # Server handler & router tambahan
│   ├── components/             # Komponen UI reusable (Dialog, Forms, Shell, Buttons)
│   ├── hooks/                  # Custom React Hooks (theme, auth, data filters)
│   ├── lib/                    # Core library, config, db, & services
│   │   ├── config/             # Environment & client setup (supabase.ts, api-config.ts)
│   │   ├── db/                 # Database client wrapper (client.ts - SQLite singleton)
│   │   └── services/           # Service layer bisnis (report-service.ts, teacher-service.ts)
│   ├── routes/                 # File-based routes (TanStack Router)
│   │   ├── __root.tsx          # Root layout, theme provider, navigation container
│   │   ├── index.tsx           # Teacher / Upgrader Dashboard principal
│   │   ├── teachers.tsx        # Management Guru (Upgrader Area)
│   │   ├── reports.tsx         # Riwayat setoran & form input setoran
│   │   ├── login.tsx / logout.tsx # Autentikasi & sesi
│   │   ├── targets.tsx         # Manajemen target hafalan
│   │   ├── notifications.tsx   # Pusat notifikasi pengguna
│   │   ├── analytics.tsx       # Analytics & grafik pencapaian
│   │   ├── achievements.tsx    # Gamifikasi & lencana prestasi
│   │   └── settings.tsx        # Pengaturan aplikasi & tema
│   ├── server-functions/       # Server functions TanStack Start (presence-server-fn.ts)
│   ├── routeTree.gen.ts        # Generated file TanStack Router (JANGAN DI-EDIT MANUAL)
│   ├── router.tsx              # Inisialisasi TanStack Router instance
│   └── styles.css              # Global styles & Tailwind CSS imports
├── AGENTS.md                   # Lovable sync & git history preservation guidelines
├── bunfig.toml / bun.lock      # Bun runtime configuration
├── vite.config.ts              # Konfigurasi Vite & `@lovable.dev/vite-tanstack-config`
└── package.json                # Manifest npm scripts & dependensi proyek
```

---

## 🔄 Application Layers & Data Flow

### 1. Presentation Layer (`src/routes/*.tsx`)
- Menggunakan TanStack Router file-based routing.
- Komponen menggunakan React 19 UI state Hooks dan Lucide React icons.
- Menerapkan desain *Modern Islamic Professional SaaS* (Responsive mobile-first, semantic colors, light/dark mode support).

### 2. Service Layer (`src/lib/services/*.ts`)
- Membungkus seluruh logika bisnis aplikasi.
- **Contoh Service Utama:**
  - `report-service.ts`: Menangani input setoran hafalan, validasi self-assessment, updating progress guru, penciptaan notifikasi & log.
  - `teacher-service.ts`: CRUD data guru, pencarian, filtering, aktivasi/deaktivasi.
  - `auth-service.ts` & `session-service.ts`: Manajemen autentikasi, pengawasan role `TEACHER` vs `UPGRADER`.
  - `gas-api-service.ts`: Komunikasi ke backend Google Apps Script.

### 3. Database Layer (`src/lib/db/client.ts`)
- Pola Singleton pada `getLocalDb()` mengisolasi file SQLite `db/quran_teacher.db`.
- Helper `dbClient` (`selectFrom`, `insertInto`, `updateTable`, `deleteFrom`) mengabstraksi query SQL agar mudah ditransisikan ke Supabase client di kemudian hari.

---

## ⚡ Data Flow Scenario: Input Setoran Hafalan

```text
[ User Form di src/routes/reports.tsx ]
                     │
                     ▼
[ Call ReportService.createReport(data) ]
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
 [ Save to Local DB ]   [ Trigger WA Notification ]
 (via dbClient/SQLite)  (via whatsapp-connector)
        │                         │
        ├─────────────────────────┼────────────────────────┐
        ▼                         ▼                        ▼
 [ Update Progress ]     [ Create Notification ]   [ Add Activity Log ]
 (Assessed Teacher)      (For Assessed Teacher)    (System Audit Log)
```

---

## 💡 Recommendations for Future Improvements (Non-Breaking)

> ⚠️ **Catatan Architectural Review:** Rekomendasi di bawah ini bersifat opsional untuk pengembangan masa depan dan **tidak boleh dieksekusi secara instan** tanpa perintah eksplisit pengguna.

1. **Unified Repository Interface:** Buat interface TypeScript abstrak `ITeacherRepository` & `IReportRepository` untuk menyatukan switching antara `SQLiteDb`, `SupabaseDb`, dan `LocalStorage` secara seamless.
2. **Strict RLS Audit:** Pastikan seluruh query Supabase mematuhi `enable-rls-with-policies.sql` jika backend Supabase diaktifkan penuh secara produksi.
