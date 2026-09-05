# 📜 DECISIONS.md — Architectural Decision Records (ADRs)

Dokumen ini mencatat keputusan-keputusan arsitektur penting yang telah diambil dalam proyek **Griya Huffazh Quran**.

---

## 📌 ADR-001: Adopsi TanStack Start (React 19 + Vite) Sebagai Fullstack Framework

- **Status:** Accepted / Active
- **Context:** Aplikasi memerlukan routing berbasis file yang efisien, dukungan SSR/SPA hybrid, performa tinggi, dan kecepatan pengembangan UI modern.
- **Options Evaluated:**
  1. Plain React SPA (Vite Vanilla React)
  2. Next.js App Router
  3. TanStack Start (React 19 + Vite + TanStack Router)
- **Chosen Approach:** TanStack Start (`@tanstack/react-start` & `@tanstack/react-router`).
- **Reason:** Integrasi seamless dengan Vite (`@lovable.dev/vite-tanstack-config`), dukungan type-safe router yang sangat baik, dan kompatibilitas native dengan platform Lovable.
- **Impact:** Komponen route dikembangkan di bawah `src/routes/`, file `src/routeTree.gen.ts` di-generate secara otomatis oleh Vite plugin.

---

## 📌 ADR-002: Arsitektur Hybrid Storage (SQLite Dev + Supabase Cloud + LocalStorage Fallback)

- **Status:** Accepted / Active
- **Context:** Pengembang membutuhkan database lokal yang cepat tanpa dependensi server cloud saat dev lokal, namun siap di-deploy ke Supabase PostgreSQL saat ke cloud.
- **Options Evaluated:**
  1. Pure LocalStorage (Terlalu terbatas untuk relasi data kompleks)
  2. Direct PostgreSQL Cloud (Membutuhkan jaringan internet konstan saat dev)
  3. Hybrid Approach (SQLite Singleton Lokal `better-sqlite3` + Supabase SDK Client Migration Target)
- **Chosen Approach:** Hybrid Approach.
- **Reason:** Memberikan kecepatan pengembangan lokal tanpa latency jaringan via `src/lib/db/client.ts`, sekaligus menyediakan skema SQL siap migrasi `db/supabase-schema.sql` dan `db/migrate-to-supabase.ts`.
- **Impact:** Service layer (`src/lib/services/*`) berkomunikasi via `dbClient` pembungkus yang dapat dialihkan ke Supabase client kapan pun diperlukan.

---

## 📌 ADR-003: Core Business Logic — Single Entry Reciprocal Setoran Assessment

- **Status:** Accepted / Active
- **Context:** Menghindari redundant data entry ketika Ustadz A menyetorkan hafalan ke Ustadz B (Mustami').
- **Options Evaluated:**
  1. Input terpisah oleh penguji dan peserta (Rentan inkonsistensi data).
  2. Single entry oleh Mustami' yang memperbarui tampilan kedua belah pihak secara otomatis.
- **Chosen Approach:** Single Entry Reciprocal Assessment.
- **Reason:** Menjamin integritas data, efisiensi waktu penguji, dan konsistensi status hafalan.
- **Impact:** Pemanggilan `ReportService.createReport()` secara otomatis mengkalkulasi ulang progress peserta di *My Upgrading Progress* dan aktivitas penguji di *My Assessment Activity*.

---

## 📌 ADR-004: Universal WhatsApp Direct Link & Web.js Notification Strategy

- **Status:** Accepted / Active
- **Context:** Penguji perlu mengirimkan notifikasi hasil setoran kepada peserta secara instan melalui WhatsApp.
- **Options Evaluated:**
  1. Paid WhatsApp Business API (Mahal untuk skala institusi awal).
  2. WhatsApp Direct Link / `whatsapp-web.js` Automation.
- **Chosen Approach:** WhatsApp Direct Link dengan draf pesan otomatis (`whatsapp-connector`).
- **Reason:** 100% kompatibel di semua platform (HP/Desktop/Cloud/Local), tidak membutuhkan server berbayar, aman, dan mudah digunakan (1-click send).
- **Impact:** Komponen form setoran langsung mengenerate pesan WA dan membukanya di HP/Laptop Mustami'.

---

## 📌 ADR-005: Integrity Guard — Preservasi Git History untuk Sinkronisasi Lovable

- **Status:** Accepted / Active
- **Context:** Proyek terhubung secara live ke platform editor Lovable.
- **Chosen Approach:** Dilarang keras melakukan rewrite git history (Force Push, Rebase, Amend).
- **Reason:** Rewrite history pada git branch akan merusak pelacakan revisi pada Lovable editor dan dapat menyebabkan kehilangan data proyek.
- **Impact:** Ditetapkan sebagai aturan mutlak di `AGENTS.md` & `.agents/RULES.md`.
