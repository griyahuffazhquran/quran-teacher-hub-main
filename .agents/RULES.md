# 🛡️ RULES.md — Strict Change Control & Operational Guardrails

## 🔴 Absolute Rule 1: Scope Containment & Minimum Change
1. **Minimum Change Required:** Lakukan perubahan sekecil dan presisi mungkin untuk memenuhi perintah user. Jangan pernah mengubah 5 file jika 1 file sudah cukup.
2. **No Unsolicited Refactoring:** Dilarang merapikan, merestrukturisasi, atau memperbarui kode yang bekerja dengan baik jika tidak diminta secara eksplisit.
3. **No Arbitrary Package Installation:** Jangan memasang dependensi baru via `npm` / `bun` tanpa persetujuan eksplisit.
4. **No Feature Bleed:** Jika user meminta perbaikan UI pada satu tombol, DILARANG mengedit tombol lain, layout, routing, atau API backend.

---

## 🔴 Absolute Rule 2: Database & API Protection
1. **Database Schema Protection:** Dilarang menghapus tabel, mengubah nama kolom, atau mengubah tipe data pada SQLite (`db/schema.sql`) atau Supabase (`db/supabase-schema.sql`) secara sepihak.
2. **Data Safety:** Dilarang mengosongkan, me-reset, atau menghapus data produksi/seed tanpa perintah user.
3. **API Contract Integrity:** Dilarang mengedit respons API, signature fungsi service, atau endpoint tanpa menyesuaikan seluruh caller yang ada.

---

## 🔴 Absolute Rule 3: Lovable Sync & Git History Protection
1. **Preserve Published Git History:** Sebagaimana ditetapkan pada `AGENTS.md`, proyek ini terhubung dengan platform **Lovable**.
2. **DILARANG KERAS:**
   - Force pushing (`git push --force`)
   - Rebasing history commit
   - Amending commit yang sudah dipush (`git commit --amend`)
   - Squashing commit yang sudah dipush
3. **Sebab:** Tindakan di atas merusak riwayat git pada sisi platform Lovable dan dapat mengakibatkan pengembang kehilangan histori proyeknya.

---

## 🔴 Absolute Rule 4: Security & Environment Protection
1. **No Secret Exposure:** Jangan pernah meng-hardcode kunci rahasia (Secret API Keys, DB Passwords, JWT Tokens) langsung di kode program. Gunakan variabel `.env`.
2. **No Silent Exception Swallowing:** Jangan menangkap error dengan `try-catch` kosong atau mengembalikan fallback palsu yang menyembunyikan masalah utama.

---

## 🟢 Mandatory Verification Standards
Sebelum menyelesaikan setiap instruksi, Agent WAJIB mengeksekusi langkah-langkah verifikasi berikut:

1. **Compilation & Type Check:** Memastikan proyek dapat di-build (`npm run build` atau `vite build`) tanpa TypeScript error.
2. **Lint Validation:** Menjalankan lint check (`npm run lint`) bila perubahan luas dilakukan.
3. **No Generated File Manual Edits:** Dilarang mengedit file generasi seperti `src/routeTree.gen.ts` secara manual; biarkan TanStack Router plugin memperbaruinya secara otomatis.

---

## 📋 Change Boundary Checklist
Sebelum memfinalisasi perubahan, Agent harus menjawab checklist internal ini:
- [ ] Apakah perubahan ini murni mematuhi perintah pengguna tanpa tambahan yang tidak diminta?
- [ ] Apakah fitur existing tetap berfungsi 100% tanpa regresi?
- [ ] Apakah tidak ada file yang dihapus tanpa persetujuan?
- [ ] Apakah git history terlindungi dan bebas dari rebase/force push?
