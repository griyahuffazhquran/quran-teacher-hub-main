---
name: database-and-migration
description: Panduan pengelolaan database SQLite lokal (better-sqlite3), skema Supabase PostgreSQL, RLS policies, dan script migrasi/sinkronisasi GAS pada proyek Griya Huffazh Quran.
---

# 🗄️ Database & Migration Skill

Skill ini memandu AI Agent dalam mengelola skema database, helper query, dan strategi migrasi data pada proyek **Griya Huffazh Quran**.

---

## 📌 Database Architecture

Sistem menggunakan pendekatan **Hybrid Database**:

1. **Dev Database Lokal (SQLite):**
   - File DB: `db/quran_teacher.db`
   - DDL Schema: `db/schema.sql`
   - Seed Data: `db/seed.sql`
   - Singleton Client: `src/lib/db/client.ts` (`getLocalDb()`, `dbClient`)
   - NPM Scripts: `npm run db:init`, `npm run db:seed`, `npm run db:reset`

2. **Cloud Migration Target (Supabase PostgreSQL):**
   - DDL Schema: `db/supabase-schema.sql`
   - RLS Policies: `db/enable-rls-with-policies.sql` / `db/disable-rls.sql`
   - Config: `src/lib/config/supabase.ts`
   - Migration Script: `npx tsx db/migrate-to-supabase.ts`

3. **Google Apps Script Sync:**
   - Script: `db/import-gas-to-sqlite.ts` (`npm run db:sync-gas`)
   - GAS Source: `google-apps-script-clean.gs`

---

## 🛠️ Step-by-Step Procedure for Schema / Query Updates

### 1. Modifying Schema
> ⚠️ **DILARANG** mengubah skema tanpa persetujuan user.
Jika diminta:
1. Update `db/schema.sql` (SQLite DDL).
2. Update `db/supabase-schema.sql` (Supabase DDL) agar seimbang.
3. Sesuaikan type definition pada TypeScript.

### 2. Executing Queries via `dbClient`
Gunakan pembungkus query singleton `dbClient` di `src/lib/db/client.ts`:

```typescript
import { dbClient } from "@/lib/db/client";

// Select
const teachers = dbClient.selectFrom<Teacher>("teachers", "status = ?", ["ACTIVE"]);

// Insert
dbClient.insertInto("reports", {
  id: crypto.randomUUID(),
  teacher_id: teacherId,
  mustami_id: mustamiId,
  material: "Tahfizh Al-Qur'an",
  grade: "A",
  created_at: new Date().toISOString(),
});

// Update
dbClient.updateTable("teachers", teacherId, { status: "INACTIVE" });
```

### 3. Migrating Data to Supabase
Jika user memerintahkan migrasi data dari SQLite lokal ke Cloud Supabase:
1. Pastikan variabel `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` terkonfigurasi di `.env`.
2. Jalankan script migrasi:
   ```bash
   npx tsx db/migrate-to-supabase.ts
   ```
3. Verifikasi ketersediaan data di dashboard Supabase.

---

## 🎯 Verification & Safety Rules
- **No Direct Schema Reset:** Dilarang mengedit atau mengosongkan `quran_teacher.db` tanpa persetujuan.
- **SQL Injection Prevention:** Selalu gunakan parameterized queries (`?`) pada `dbClient`.
- **Foreign Keys:** SQLite diinisialisasi dengan `PRAGMA foreign_keys = ON;`. Pastikan relasi `teacher_id` dan `mustami_id` valid.
