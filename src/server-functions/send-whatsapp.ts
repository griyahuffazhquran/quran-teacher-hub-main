/**
 * Server Function: Kirim Notifikasi WhatsApp Setoran Hafalan
 *
 * TanStack Start server function yang dipanggil dari client
 * untuk mengirim pesan WhatsApp otomatis via whatsapp-web.js.
 */

import { createServerFn } from "@tanstack/react-start";
import { sendWhatsAppMessage, getWhatsAppStatus } from "../lib/whatsapp-server";

// ─── Format pesan setoran ───────────────────────────────────────────────────

interface SetoranPayload {
  namaPeserta: string;
  nomorWaPeserta: string;
  namaSurah: string;
  ayatAwal: string | number;
  ayatAkhir: string | number;
  nilai: string | number;
  catatan?: string;
  namaPenguji: string;
  tanggal?: string;
}

function formatSetoranMessage(data: SetoranPayload): string {
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

// ─── Server Functions ───────────────────────────────────────────────────────

export const sendSetoranNotifWA = createServerFn({ method: "POST" })
  .validator((data: SetoranPayload) => data)
  .handler(async ({ data }) => {
    if (!data.nomorWaPeserta) {
      return {
        success: false,
        message: "Nomor WhatsApp peserta belum diisi.",
        error: "MISSING_PHONE",
      };
    }

    const message = formatSetoranMessage(data);
    const result = await sendWhatsAppMessage(data.nomorWaPeserta, message);

    return result;
  });

export const checkWhatsAppStatus = createServerFn({ method: "GET" }).handler(async () => {
  return getWhatsAppStatus();
});
