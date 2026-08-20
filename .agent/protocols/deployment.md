# 🚀 Deployment & Build Protocol

Protocol ini mengatur langkah-langkah verifikasi sebelum dan sesudah deployment.

---

## 🛠️ Pre-Deployment Checklist

1. Jalankan `npm run lint` untuk memastikan tidak ada lint error.
2. Jalankan `npm run build` atau `bun run build` untuk memverifikasi proses kompilasi Vite/TanStack Start.
3. Cek output build pada folder `.output` / `dist` jika diperlukan.

## 📦 Deployment Process

- Sinkronisasi dilakukan secara otomatis via git commit ke repository branch yang terhubung dengan Lovable / Cloudflare / Hosting platform.
- **Dilarang keras**: `git push --force` atau squash commit yang sudah di-push!
