---
name: debugging-and-troubleshooting
description: Protokol 6 langkah investigasi bug dan perbaikan root cause (Reproduce, Isolate, Root Cause, Fix, Verify, Regression Check) pada proyek Griya Huffazh Quran.
---

# 🔍 Debugging & Troubleshooting Skill

Skill ini memandu AI Agent dalam menginvestigasi bug, mendiagnosis kegagalan runtime/build, dan menerapkan perbaikan root-cause tanpa menutupi gejala (*symptom patching*).

---

## 📌 6-Step Debugging Protocol

DILARANG KERAS langsung mengubah kode saat error terjadi tanpa melewati siklus investigasi:

```
  [1. REPRODUCE] ──> [2. ISOLATE] ──> [3. ROOT CAUSE] ──> [4. FIX] ──> [5. VERIFY] ──> [6. REGRESSION CHECK]
```

1. **REPRODUCE:** Pahami skenario persis di mana error terjadi (misal: saat klik tombol simpan setoran, saat switch role, atau saat dev build).
2. **ISOLATE:** Batasi lokasi error ke komponen, service, atau fungsi spesifik menggunakan stack trace atau log.
3. **ROOT CAUSE:** Cari penyebab mendasar (misal: `undefined` reference, null state, SQL constraint mismatch, atau broken import).
4. **FIX:** Terapkan perbaikan minimum yang paling aman (*Minimum Change Required*). DILARANG menggunakan silent `try-catch` kosong atau me-return data palsu.
5. **VERIFY:** Jalankan `npm run build` atau pengujian fitur terkait untuk memastikan bug teratasi.
6. **REGRESSION CHECK:** Pastikan alur kerja lain yang berdampingan tidak menjadi rusak akibat perbaikan.

---

## 🛠️ Common Issue Scenarios & Troubleshooting Guides

### Scenario 1: `src/routeTree.gen.ts` Out of Sync / Broken Import
- **Symptom:** TanStack Router mengeluhkan route tidak ditemukan atau `routeTree` error.
- **Root Cause:** File route baru dibuat tanpa generasi otomatis dari Vite plugin.
- **Solution:** Jalankan `npm run dev` atau `npm run build` agar `@tanstack/router-plugin` membangun ulang `routeTree.gen.ts`. DILARANG mengedit `routeTree.gen.ts` secara manual.

### Scenario 2: SQLite `better-sqlite3` File Lock / Binding Issue
- **Symptom:** Error `SQLITE_BUSY` atau database locked saat menjalankan dev server/script.
- **Root Cause:** Multiple instance koneksi SQLite terbuka secara bersamaan.
- **Solution:** Verifikasi penggunaan singleton `getLocalDb()` pada `src/lib/db/client.ts`. Pastikan tidak ada `new Database()` langsung di luar client.

### Scenario 3: Reciprocal Setoran Tidak Muncul di One of the Views
- **Symptom:** Setoran muncul di *My Assessment Activity* penguji, tetapi TIDAK muncul di *My Upgrading Progress* peserta.
- **Root Cause:** Identifikasi ID guru pada payload `createReport` tertukar (`teacherId` vs `mustamiId`).
- **Solution:** Periksa mapping pada `ReportService.createReport()` di `src/lib/services/report-service.ts`. Pastikan `teacher_id` adalah ID peserta dan `mustami_id` adalah ID penguji yang sedang login.

---

## 🎯 Reporting Standards for Debugging
Setiap laporan debugging WAJIB menyertakan:
- **Observed Behavior:** Error yang terjadi & log pendukung.
- **Root Cause Analysis:** Penjelasan penyebab teknis utama.
- **Fix Applied:** Diff perubahan minim yang dilakukan.
- **Verification Result:** Hasil pengujian build & UI.
