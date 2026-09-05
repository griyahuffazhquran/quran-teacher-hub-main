---
name: griya-huffazh-domain
description: Panduan domain dan bisnis spesifik proyek Griya Huffazh Quran (setoran hafalan Al-Qur'an, aturan timbal-balik Mustami', predikat A-D, role Teacher vs Upgrader, target, dan achievements).
---

# 📖 Griya Huffazh Domain Skill

Skill ini memberikan panduan aturan bisnis (*Business Domain*) spesifik untuk pengembangan platform **Griya Huffazh Quran — Teacher Upgrading Management System**.

---

## 📌 Domain Overview & Entities

### 1. Dual Roles Protocol
- **`TEACHER` (Guru / Ustadz / Ustadzah):**
  - Subyek upgrading hafalan.
  - Otoritas menyimak hafalan guru lain (**Mustami'**).
  - Hak akses: Dashboard `My Upgrading Progress` (sebagai peserta) & `My Assessment Activity` (sebagai penyimak).
- **`UPGRADER` (Admin / Pengelola / Evaluator):**
  - Otoritas penuh melihat dan mengelola seluruh data guru, setoran, pengumuman, dan target institusi.
  - Mengakses halaman manajemen guru (`teachers.tsx`) dan analitik global (`analytics.tsx`).

### 2. Reciprocal Setoran Business Rule (Single Entry Principle)
Ketika **Ustadz A** menyetorkan materi kepada **Ustadz B**:
- **Ustadz B** bertindak sebagai **Mustami'** (Penguji/Penyimak).
- **Ustadz A** bertindak sebagai **Teacher Assessed** (Peserta yang disimak).
- **Satu kali submit oleh Mustami' WAJIB:**
  1. Menyimpan record `reports` dengan `createdBy = Ustadz B` dan `teacherId = Ustadz A`.
  2. Memperbarui progress hafalan Ustadz A di *My Upgrading Progress*.
  3. Memperbarui histori pengujian Ustadz B di *My Assessment Activity*.
  4. Memicu pembuatan notifikasi internal untuk Ustadz A.
  5. Menambahkan log pada `activityLogs`.
  6. Menginisialisasi notifikasi WhatsApp ke Ustadz A (`whatsapp-connector`).

### 3. Skema Penilaian & Materi
- **Materi Setoran:**
  - `Tahfizh Al-Qur'an`: Surah, Ayat Awal - Ayat Akhir, Juz/Halaman.
  - `Matn`: Tajwid/Qira'at (Tuhfatul Athfal, Jazariyah, dll.).
  - `Hadits`: Arba'in An-Nawawiyah, dll.
  - `Lainnya`: Materi pendukung.
- **Predikat / Grade:**
  - `A`: Sangat Baik (Lancar tanpa salah)
  - `B`: Baik (1-2 kesalahan kecil)
  - `C`: Cukup (Perlu perbaikan tajwid/kelancaran)
  - `D`: Perlu Mengulang (Wajib setor ulang)
- **Catatan PR:** Detail halaman/ayat yang harus diperbaiki dan disetor kembali pada sesi berikutnya.

---

## 🔄 Procedure for Feature Implementation

1. **Verify Entity Constraints:**
   - Guru TIDAK BOLEH menilai dirinya sendiri (`mustamiId !== teacherId`).
   - Setiap setoran wajib memiliki `teacherId`, `mustamiId`, `material`, `grade`, dan `date`.
2. **Execute via Service Layer:**
   - Panggil `ReportService.createReport()` di `src/lib/services/report-service.ts`.
   - DILARANG melakukan manipulasi database/storage langsung dari UI komponen.
3. **Verify Reciprocity UI:**
   - Buka `reports.tsx` dan pastikan data muncul di tab *My Upgrading Progress* milik peserta dan *My Assessment Activity* milik penguji.

---

## 🎯 Validation Checklist
- [ ] Self-assessment tercegah (`teacherId !== currentUserId`).
- [ ] Data tersimpan via `ReportService` tanpa memotong layer.
- [ ] Predikat valid (A, B, C, atau D).
- [ ] WhatsApp notification draf terbuat secara instan.
