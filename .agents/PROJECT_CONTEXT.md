# 📋 PROJECT_CONTEXT.md — Griya Huffazh Quran Teacher Upgrading System

## 📌 Identification & Purpose

- **Project Name:** Griya Huffazh Quran — Teacher Upgrading Management System
- **Repository Directory:** `quran-teacher-hub-main`
- **Primary Objective:** Platform manajemen upgrade kualitas guru/ustadz/ustadzah di Griya Huffazh Quran. Sistem mengelola proses setoran hafalan Al-Qur'an, penilaian materi (Tahfizh, Matn, Hadits), pencapaian target hafalan, pengumuman, serta pemantauan aktivitas menguji (Mustami').

---

## 👥 User Personas & Roles

Sistem mendukung 2 role utama dengan kontrol terpusat:

1. **`TEACHER` (Guru / Ustadz / Ustadzah):**
   - Melakukan setoran hafalan/materi kepada guru lain.
   - Bertindak sebagai **Mustami'** (penyimak/penguji) untuk guru lain.
   - Mengakses Dashboard Pribadi (*My Upgrading Progress* & *My Assessment Activity*).
   - Melihat target hafalan, pengumuman, dan pencapaian lencana (*achievements*).

2. **`UPGRADER` (Admin / Superadmin / Management):**
   - Mengelola master data guru (tambah, edit, nonaktifkan, assign role/jabatan).
   - Melihat dashboard analitik seluruh institusi.
   - Mengatur target hafalan global dan target per guru.
   - Mengirimkan pengumuman institusi dan mengekspor laporan.

---

## 💡 Core Business Logic & Domain Rules

### 1. Prinsip Timbal-Balik Setoran (Reciprocal Assessment)
- Seorang guru (**Ustadz A**) menyetor hafalan kepada **Ustadz B**.
- Ustadz B bertindak sebagai **Mustami'** (Penguji), Ustadz A bertindak sebagai **Teacher Being Assessed**.
- Ketika laporan setoran disimpan:
  - **Ustadz A** melihat laporan di menu **"My Upgrading Progress"**.
  - **Ustadz B** melihat laporan di menu **"My Assessment Activity"**.
- **Single Entry Principle:** Input dilakukan 1 kali oleh Mustami', secara otomatis memperbarui record kedua belah pihak, memicu notifikasi, membuat activity log, dan memperbarui analitik.

### 2. Struktur Setoran & Penilaian
- **Kategori Materi:**
  - `Tahfizh Al-Qur'an` (Surah, Ayat Awal - Ayat Akhir, Juz/Halaman)
  - `Matn` (Tuhfatul Athfal, Jazariyah, dll.)
  - `Hadits` (Arba'in An-Nawawiyah, dll.)
  - `Lainnya`
- **Predikat / Grade:** `A` (Sangat Baik), `B` (Baik), `C` (Cukup), `D` (Perlu Mengulang).
- **Catatan:** `Catatan PR` (Perbaikan yang harus diulang) & `Catatan Mustami'` (Apresiasi/evaluasi penguji).

---

## 🛠️ Technology Stack & Environment

| Layer | Technology | Details / Configuration |
| :--- | :--- | :--- |
| **Framework** | TanStack Start (React 19 + Vite) | Fullstack React dengan router plugin `@tanstack/router-plugin` & SSR/Nitro runtime. |
| **Language** | TypeScript 5.8 | ES Modules (`"type": "module"`), strict mode. |
| **Styling & UI** | Tailwind CSS v4 & Radix UI | Utility-first CSS (`@tailwindcss/vite`), Radix Primitives, Lucide React icons. |
| **State & Forms** | React Hook Form + Zod | Validasi skema tipe form yang ketat. |
| **Data Engine (Local)**| SQLite (`better-sqlite3`) | `db/quran_teacher.db` diakses via `src/lib/db/client.ts`. |
| **Cloud Engine** | Supabase JS (`@supabase/supabase-js`) | Cloud backend DB (`db/supabase-schema.sql`, `src/lib/config/supabase.ts`). |
| **Legacy & Sync** | Google Apps Script (GAS) | `google-apps-script-clean.gs`, `src/lib/services/gas-api-service.ts`. |
| **Notification Integration**| WhatsApp Connector | Utility pengirim notifikasi WA otomatis ke peserta setoran (`whatsapp-connector`). |
| **Deploy & Editor Sync**| Lovable Connected Platform | Terhubung ke Lovable (`AGENTS.md` - jatah git history tidak boleh di-rewrite). |

---

## 📖 Key Domain Terms & Glossary

- **Mustami':** Guru/Ustadz yang bertugas mendengarkan, menyimak, dan memberikan nilai setoran hafalan.
- **Teacher Assessed:** Guru yang sedang menyetorkan hafalan/materi.
- **Upgrader:** Peran manajemen/admin yang bertanggung jawab atas pengembangan kualifikasi pengajar.
- **Setoran / Report:** Catatan transaksi evaluasi hafalan lengkap dengan materi, juz/ayat, nilai, dan tanggal.
- **Catatan PR:** Tugas perbaikan hafalan yang wajib disetorkan kembali pada sesi berikutnya.
- **Target Hafalan:** Sasaran kuantitatif hafalan Al-Qur'an (misal: 5 Juz) yang harus dicapai dalam periode tertentu.
