/**
 * WhatsApp Notification Helper (Client-Side) - Griya Huffazh Learn
 *
 * Menghubungkan client ke server function untuk pengiriman
 * notifikasi WhatsApp otomatis via whatsapp-web.js di server.
 */

import { sendSetoranNotifWA } from "../server-functions/send-whatsapp";

export interface SetoranNotificationData {
  namaPeserta: string;
  nomorWaPeserta: string;
  namaSurah: string;
  ayatAwal: number | string;
  ayatAkhir: number | string;
  nilai: string | number;
  catatan?: string;
  namaPenguji: string;
  tanggal?: string | undefined;
}

/**
 * Format nomor HP Indonesia ke format internasional (misal 0812... -> 62812...)
 */
export function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  }
  return cleaned;
}

/**
 * Membuat teks pesan WhatsApp yang terformat rapi untuk santri/peserta.
 */
export function formatWhatsAppSetoranMessage(data: SetoranNotificationData): string {
  const tgl =
    data.tanggal ||
    new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return `Assalamu'alaikum Warahmatullahi Wabarakatuh, Sdr/i *${data.namaPeserta}*,

Laporan Setoran Hafalan Al-Qur'an:
📖 *Surah/Juz*: ${data.namaSurah} (Ayat ${data.ayatAwal} - ${data.ayatAkhir})
⭐ *Predikat/Nilai*: ${data.nilai}
📝 *Catatan Penguji*: ${data.catatan || "-"}
👨‍🏫 *Penguji*: ${data.namaPenguji}
📅 *Tanggal*: ${tgl}

Jazakumullahu khairan. Semoga Allah memudahkan langkah dalam menjaga Al-Qur'an! 🌟`;
}

/**
 * Membuat URL WhatsApp universal (Mobile App / Desktop App / WhatsApp Web).
 */
export function getWhatsAppDirectUrl(data: SetoranNotificationData): string {
  const phone = normalizePhoneNumber(data.nomorWaPeserta);
  const text = encodeURIComponent(formatWhatsAppSetoranMessage(data));
  return `https://wa.me/${phone}?text=${text}`;
}

/**
 * Pengiriman Notifikasi WhatsApp Instan (Universal - Compatible Lokal & Netlify):
 * Begitu Penguji B menyimpan setoran, sistem merangkai pesan otomatis dan
 * membuka WhatsApp ke nomor Peserta A. Penguji B cukup klik 'Kirim'.
 */
export async function sendWhatsAppNotifSetoran(
  data: SetoranNotificationData,
): Promise<{ success: boolean; message: string; webUrl: string }> {
  const webUrl = getWhatsAppDirectUrl(data);
  return {
    success: true,
    webUrl,
    message: "Membuka WhatsApp untuk pengiriman pesan...",
  };
}
