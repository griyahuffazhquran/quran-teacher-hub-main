# 🔄 WORKFLOW.md — Standard Agentic Execution Framework

## 🎯 General Execution Framework

Setiap pengerjaan tugas oleh Agent WAJIB mengikuti siklus 5 tahap berikut:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  1. UNDERSTAND  │ ──> │     2. PLAN     │ ──> │   3. EXECUTE    │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                        ┌─────────────────┐              ▼
                        │    5. REPORT    │ <── ┌─────────────────┐
                        └─────────────────┘     │    4. VERIFY    │
                                                └─────────────────┘
```

---

## 📑 Detailed Stage Procedures

### Stage 1: UNDERSTAND
- Read requirement prompt from user.
- Inspect affected files using `view_file` or `grep_search`.
- Identify existing business logic & potential side effects.
- Define explicit **Scope Boundaries** (File yang disentuh vs File yang dilindungi).

### Stage 2: PLAN
- Formulate a precise step-by-step implementation plan.
- Identify the smallest possible diff (*Minimum Change Required*).
- Verify if user approval is required (misal: perubahan skema DB atau API contract).

### Stage 3: EXECUTE
- Modify target code using precision replacement tools (`replace_file_content` / `multi_replace_file_content`).
- Maintain existing coding style, variable conventions, and formatting.
- Do NOT refactor or touch adjacent code unrelated to the task.

### Stage 4: VERIFY
- Verify code compiles clean without TypeScript or Vite build errors (`npm run build`).
- Verify no console errors or broken imports exist.
- Perform sanity check on existing application features.

### Stage 5: REPORT
- Summarize changes concisely:
  - **Files Modified:** List path file dan deskripsi perubahan.
  - **Protected Areas:** Area sensitif yang sengaja tidak disentuh.
  - **Verification Status:** Status build & lint test.
  - **Next Steps:** Langkah tindak lanjut jika ada.

---

## 🛠️ Project-Specific Implementation Workflows

### 1. Service-First & UI Integration Workflow (Features & Fixes)
Gunakan alur ini saat menambah atau mengubah fitur setoran, teacher, atau analytics:
1. **Service Layer Update:** Ubah/tambahkan logika pada `src/lib/services/*.ts`.
2. **Type Definition Check:** Pastikan interface TypeScript di `src/lib/services/` atau `src/lib/db/` konsisten.
3. **UI Route Integration:** Hubungkan service ke komponen di `src/routes/*.tsx`.
4. **Form & Zod Validation:** Pastikan validasi form `react-hook-form` + `zod` berjalan.

### 2. Database & Schema Migration Workflow
Gunakan alur ini jika perubahan skema database diminta secara eksplisit:
1. **DDL SQL Update:** Perbarui `db/schema.sql` (SQLite) dan/atau `db/supabase-schema.sql` (Supabase).
2. **DB Client Helper Update:** Perbarui method pada `src/lib/db/client.ts`.
3. **Migration Script Check:** Bila beralih ke Supabase, perbarui `db/migrate-to-supabase.ts`.
4. **Verification:** Jalankan `npm run db:init` jika dev database SQLite perlu dipersiapkan ulang.

### 3. WhatsApp Notification Delivery Workflow
Gunakan alur ini untuk pengujian notifikasi setoran hafalan:
1. **Format Message Check:** Verifikasi susunan template pesan WA pada `whatsapp-connector`.
2. **Form Event Trigger:** Pastikan `sendWhatsAppNotifSetoran` dipanggil pasca-sukses simpan setoran di `reports.tsx`.
3. **Fallback Toast:** Pastikan toast notification muncul jika pengiriman otomatis berhalangan.
