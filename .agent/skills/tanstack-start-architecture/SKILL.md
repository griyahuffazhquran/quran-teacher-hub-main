---
name: tanstack-start-architecture
description: Panduan arsitektur TanStack Start, TanStack Router (file-based routing), React 19, Vite, dan komponen UI Radix/Tailwind v4 pada proyek Griya Huffazh Quran.
---

# ⚡ TanStack Start Architecture Skill

Skill ini memandu AI Agent dalam merancang, menambah, dan mengubah komponen UI serta route handler menggunakan **TanStack Start (React 19 + Vite)**.

---

## 📌 Route Conventions (`src/routes/`)

Proyek ini menggunakan **File-based Routing** TanStack Router:

- `src/routes/__root.tsx`: Root Layout container (menyediakan Navbar, Header, ThemeProvider, dan Toast Notification container).
- `src/routes/index.tsx`: Halaman utama Dashboard (Teacher / Upgrader Overview).
- `src/routes/teachers.tsx`: Manajemen data guru (Upgrader Role access).
- `src/routes/reports.tsx`: Formulir setoran & daftar riwayat setoran.
- `src/routes/targets.tsx`: Pengaturan target hafalan & tracking.
- `src/routes/notifications.tsx`: Pusat notifikasi pengguna.
- `src/routes/analytics.tsx`: Analytics visualisasi grafik.
- `src/routes/achievements.tsx`: Gamifikasi & sistem lencana.
- `src/routes/settings.tsx`: Pengaturan preferensi sistem & tema.

> ⚠️ **PENTING:** `src/routeTree.gen.ts` di-generate secara otomatis oleh Vite plugin. **DILARANG mengedit file `routeTree.gen.ts` secara manual.**

---

## 🛠️ Step-by-Step Procedure for UI & Route Changes

### 1. Adding / Updating a Route
1. Edit atau buat file route di `src/routes/<route-name>.tsx`.
2. Gunakan `createFileRoute('/<route-name>')` dari `@tanstack/react-router`.
3. Gunakan komponen UI reusable dari `src/components/ui/` (Radix UI + Tailwind CSS v4).
4. Jalankan `npm run dev` atau build check untuk memicu generasi ulang `routeTree.gen.ts`.

### 2. Form & Validation Standard
1. Gunakan `react-hook-form` dikombinasikan dengan validasi `zod` via `@hookform/resolvers/zod`.
2. Selalu sediakan pesan error yang jelas untuk setiap field input.
3. Contoh skema Zod:
   ```typescript
   import { z } from "zod";

   export const reportFormSchema = z.object({
     teacherId: z.string().min(1, "Pilih nama guru"),
     material: z.enum(["Tahfizh Al-Qur'an", "Matn", "Hadits", "Lainnya"]),
     materialDetail: z.string().min(1, "Rincian materi wajib diisi"),
     grade: z.enum(["A", "B", "C", "D"]),
     date: z.string().min(1, "Tanggal wajib diisi"),
   });
   ```

### 3. State Management & Theme
- **Global Theme:** Dikelola oleh `src/lib/theme.tsx` (Light / Dark / System mode).
- **Session State:** Dikelola oleh `src/lib/services/session-service.ts` & `auth-service.ts`.
- **Data Fetching:** Gunakan `@tanstack/react-query` atau React Hooks yang membungkus service layer.

---

## 🎯 Verification
- Jalankan `npm run build` untuk memverifikasi bahwa seluruh route dan jenis tipe TypeScript valid.
- Pastikan tidak ada console error saat bernavigasi antar rute.
