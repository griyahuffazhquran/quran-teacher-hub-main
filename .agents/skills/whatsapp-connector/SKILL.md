---
name: whatsapp-connector
description: Skill integrasi WhatsApp Connector untuk pengiriman notifikasi otomatis setoran hafalan Al-Qur'an dari penguji (Mustami') ke peserta (Teacher Assessed).
---

# 💬 WhatsApp Connector Skill — Griya Huffazh Quran

Skill ini memandu AI Agent dalam mengintegrasikan fitur notifikasi **WhatsApp** otomatis setiap kali **Mustami' (Penguji)** menginput data setoran hafalan Al-Qur'an untuk **Peserta**.

---

## 🎯 Architectural Flow

```text
[ Mustami' (Penguji) ] ── Input Form Setoran ──> [ Simpan Setoran ]
                                                          │
                                                          ▼
                                            [ Generate Draf WhatsApp ]
                                                          │
                                                          ▼
                                            📱 Buka WA App / WA Web
                                            (Pesan terformat siap kirim)
```

---

## 📲 Format Pesan Notifikasi WA

```text
Assalamu'alaikum Warahmatullahi Wabarakatuh, Sdr/i {nama_peserta},

Laporan Setoran Hafalan Al-Qur'an:
📖 Surah / Rincian : {materi_rincian} ({referensi})
⭐ Predikat/Nilai  : {nilai}
📝 Catatan Mustami': {catatan_mustami}
📌 Catatan PR      : {catatan_pr}
👨‍🏫 Penguji (Mustami'): {nama_penguji}
📅 Tanggal         : {tanggal}

Jazakumullahu khairan. Semoga Allah memudahkan langkah dalam menjaga Al-Qur'an! 🌟
```

---

## 🛠️ Step-by-Step Integration Guide

### 1. Direct Link Generator Method (Universal & Light)
Sistem menggunakan pendekatan **1-Click Send Universal Direct Link** yang 100% kompatibel di Netlify, Cloudflare Workers, Desktop, dan Mobile HP tanpa butuh QR Code Server:

```typescript
export function buildWhatsAppSetoranUrl(data: {
  phone: string;
  namaPeserta: string;
  materiRincian: string;
  referensi: string;
  nilai: string;
  catatanMustami: string;
  catatanPR: string;
  namaPenguji: string;
  tanggal: string;
}): string {
  const cleanPhone = data.phone.replace(/[^0-9]/g, "").replace(/^0/, "62");
  
  const text = `Assalamu'alaikum Warahmatullahi Wabarakatuh, Sdr/i ${data.namaPeserta},\n\n` +
    `Laporan Setoran Hafalan Al-Qur'an:\n` +
    `📖 Surah / Rincian : ${data.materiRincian} (${data.referensi})\n` +
    `⭐ Predikat/Nilai  : ${data.nilai}\n` +
    `📝 Catatan Mustami': ${data.catatanMustami || "-"}\n` +
    `📌 Catatan PR      : ${data.catatanPR || "-"}\n` +
    `👨‍🏫 Penguji (Mustami'): ${data.namaPenguji}\n` +
    `📅 Tanggal         : ${data.tanggal}\n\n` +
    `Jazakumullahu khairan. Semoga Allah memudahkan langkah dalam menjaga Al-Qur'an! 🌟`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}
```

### 2. Implementation in Submit Handler (`src/routes/reports.tsx`)
Setelah `ReportService.createReport()` berhasil menyimpan data setoran:

```typescript
// Auto trigger WA Link
const waUrl = buildWhatsAppSetoranUrl({
  phone: targetTeacher.phone || "",
  namaPeserta: targetTeacher.name,
  materiRincian: formValues.materialDetail,
  referensi: formValues.reference,
  nilai: formValues.grade,
  catatanMustami: formValues.mustamiNote,
  catatanPR: formValues.prNote,
  namaPenguji: currentUser.name,
  tanggal: formValues.date,
});

window.open(waUrl, "_blank");
```

---

## 🎯 Verification & Fallbacks
- Pastikan format nomor telepon otomatis dikonversi ke format internasional (`62xxx`).
- Jika nomor HP peserta kosong, tampilkan Toast Warning: `"Setoran tersimpan, namun nomor WA peserta belum terdaftar"`.
