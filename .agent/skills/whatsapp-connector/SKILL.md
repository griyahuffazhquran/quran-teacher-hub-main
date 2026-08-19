---
name: whatsapp-connector
description: Skill integrasi WhatsApp Connector untuk pengiriman notifikasi otomatis setoran hafalan Al-Qur'an dari penguji (B) ke peserta (A).
---

# WhatsApp Connector Skill - Griya Huffazh Learn

Skill ini memandu AI Agent dalam mengintegrasikan fiturnya agar setiap kali **Penguji (B)** menginput data setoran hafalan Al-Qur'an, sistem secara otomatis mengirimkan notifikasi **WhatsApp** ke nomor HP **Peserta (A)** — **langsung terkirim tanpa klik manual**.

---

## 🎯 Use Case Utama

```
[ Peserta A ] ── Setor Hafalan ──> [ Penguji B ]
                                         │
                                   Input Data Setoran
                                         │
                                         ▼
                             [ Griya Huffazh System ]
                                         │
                            Server: whatsapp-web.js
                                         │
                                         ▼
                            💬 Pesan WA Otomatis ke Peserta A
                            (langsung terkirim, tanpa klik manual)
```

---

## 📲 Format Pesan Notifikasi WA

```text
Assalamu'alaikum Warahmatullahi Wabarakatuh, Sdr/i {nama_peserta},

Laporan Setoran Hafalan Al-Qur'an:
📖 Surah / Juz : {nama_surah} ({ayat_awal} - {ayat_akhir})
⭐ Predikat/Nilai: {nilai}
📝 Catatan Penguji: {catatan}
👨‍🏫 Penguji       : {nama_penguji}
📅 Tanggal       : {tanggal}

Jazakumullahu khairan. Semoga Allah memudahkan langkah dalam menjaga Al-Qur'an! 🌟
```

---

## 🛠️ Metode Integrasi: Universal WhatsApp Direct Link (1-Click Send)

Sistem dirancang sangat ringan, handal, dan **100% kompatibel di semua platform (Netlify Cloud, Server Lokal, HP Android/iOS, maupun Laptop)** tanpa perlu setup server/QR code.

### Alur Skenario:
1. **Penguji B** menginput data setoran **Peserta A** di form setoran.
2. **Penguji B** mengklik tombol **"Simpan Setoran"**.
3. Sistem secara otomatis merangkai seluruh data setoran menjadi pesan WhatsApp yang rapi dan menarik.
4. Jendela aplikasi **WhatsApp (di HP)** atau **WhatsApp Web/Desktop (di Laptop)** langsung terbuka mengarah ke nomor HP Peserta A dengan **seluruh draf pesan setoran sudah terisi penuh**.
5. **Penguji B tinggal mengklik tombol Kirim / Send (1x klik di WhatsApp)**.

---

## 💻 Contoh Kode Integrasi

### Server-Side (whatsapp-server.ts)

```typescript
import { sendWhatsAppMessage } from "./lib/whatsapp-server";

// Kirim pesan otomatis
const result = await sendWhatsAppMessage("081234567890", "Halo dari Griya Huffazh!");
// result: { success: true, message: "Pesan berhasil dikirim ke 081234567890" }
```

### Client-Side (via Server Function)

```typescript
import { sendWhatsAppNotifSetoran } from "@/lib/whatsapp";

const result = await sendWhatsAppNotifSetoran({
  namaPeserta: "Ahmad",
  nomorWaPeserta: "081234567890",
  namaSurah: "Al-Baqarah",
  ayatAwal: 1,
  ayatAkhir: 20,
  nilai: "A",
  catatan: "Lancar, tajwid baik",
  namaPenguji: "Ustadz Ali",
  tanggal: "2026-08-19",
});
```

---

## ⚡ Langkah Implementasi di Form Setoran

1. Pastikan `whatsapp-web.js` dan `qrcode-terminal` terinstall di `package.json`.
2. Pada handler `submit` di `ReportFormDialog.tsx`, setelah data berhasil disimpan:
   ```typescript
   const waResult = await sendWhatsAppNotifSetoran({
     namaPeserta: assessedName,
     nomorWaPeserta: targetTeacher.phone,
     namaSurah: form.materialDetail,
     ayatAwal: form.reference,
     ayatAkhir: "-",
     nilai: form.grade,
     catatan: form.mustamiNote,
     namaPenguji: currentUser.name,
     tanggal: form.date,
   });
   ```
3. Toast notification menampilkan status sukses/gagal di browser.
4. Pesan WhatsApp terkirim otomatis dari nomor Superadmin ke HP Peserta A.

---

## ⚠️ Catatan Penting

- **Hanya untuk lokal / VPS** — `whatsapp-web.js` membutuhkan Puppeteer/Chromium, tidak bisa di serverless (Netlify/Vercel/Cloudflare Workers).
- **Scan QR sekali** — Setelah pertama kali, sesi disimpan di `.wwebjs_auth/`.
- **Folder `.wwebjs_auth/`** sudah ditambahkan ke `.gitignore`.
