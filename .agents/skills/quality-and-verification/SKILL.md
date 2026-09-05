---
name: quality-and-verification
description: Panduan pengujian kualitas kode, verifikasi build TypeScript/Vite, linting, dan aturan preservasi git history platform Lovable pada proyek Griya Huffazh Quran.
---

# ✅ Quality & Verification Skill

Skill ini memandu AI Agent dalam mengeksekusi quality gates, memvalidasi integritas build, dan menjaga kepatuhan aturan proyek.

---

## 📌 Quality Gates Framework

Sebelum menyatakan suatu tugas selesai, AI Agent wajib mengeksekusi 4 Quality Gates:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ 1. SCOPE CHECK  │ ──> │ 2. TYPE & BUILD │ ──> │  3. LINT CHECK  │ ──> │ 4. GIT INTEGRITY│
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 🛠️ Step-by-Step Verification Procedure

### Gate 1: Scope & Diff Minimization Check
- Bandingkan file yang diubah dengan permintaan pengguna.
- Pastikan tidak ada file yang di-refactor tanpa izin.
- Pastikan tidak ada dependensi baru yang dipasang tanpa persetujuan.

### Gate 2: Compilation & TypeScript Check
Eksekusi perintah build untuk memverifikasi tidak ada error sintaks atau tipe:

```bash
npm run build
```

Atau jika pengujian development build dibutuhkan:
```bash
npm run build:dev
```

### Gate 3: Lint & Formatting Check
Jalankan ESLint & Prettier check:

```bash
npm run lint
```

Jika terdapat kesalahan sepele pada formatting yang aman:
```bash
npm run format
```

### Gate 4: Lovable Git History Safety Check
Sesuai aturan `AGENTS.md`:
- Pastikan tidak ada perintah `git push --force`.
- Pastikan tidak ada `git rebase` atau `git commit --amend` pada commit yang telah terdorong ke `origin/main`.
- Pertahankan ketersediaan branch dalam keadaan working state.

---

## 🛑 Failure Handling
- **Build Error Detected:** STOP! Baca log error secara utuh. Lakukan perbaikan langsung pada root cause error sebelum melaporkan ke pengguna. Jangan menutup tugas jika build masih gagal.
- **Lint Warning:** Perbaiki error yang dipicu oleh kode baru, dan jangan merusak kode yang sudah bekerja.
