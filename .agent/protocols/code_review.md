# 📋 Code Review Protocol

Protocol ini digunakan oleh AI Agent sebelum menyetujui atau commit perubahan kode pada proyek **Griya Huffazh Learn**.

---

## 🔍 Checklist Review Kode

### 1. Structure & Syntax

- [ ] Komponen React ditulis dengan functional components & TypeScript.
- [ ] Penggunaan hook React 19 / TanStack Router sesuai kaidah standar.
- [ ] Import tertata rapi (alias path `@/...` jika ada, diikuti paket eksternal).

### 2. Styling & Design

- [ ] Menggunakan Tailwind CSS v4 & class utility standar.
- [ ] Desain konsisten dengan UI/UX aplikasi (Clean, Modern, Accessible).
- [ ] Responsif untuk mobile, tablet, dan desktop.

### 3. Safety & Performance

- [ ] Tidak memasukkan credentials/secrets secara hardcode.
- [ ] Form handling divalidasi menggunakan Zod schema.
- [ ] Tidak ada warning ESLint/TypeScript berlebih.

### 4. Git & Lovable Sync Compliance

- [ ] Tidak melakukan rebase / force push yang merusak git history Lovable.
