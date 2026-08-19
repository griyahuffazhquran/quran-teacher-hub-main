/**
 * WhatsApp Server Client - Griya Huffazh Learn
 *
 * Singleton WhatsApp client menggunakan whatsapp-web.js.
 * Menjalankan WhatsApp Web secara headless di server agar pesan
 * dapat dikirim secara programatik tanpa interaksi manual.
 *
 * Setup: Scan QR code satu kali di terminal saat pertama run,
 * setelahnya sesi tersimpan otomatis via LocalAuth.
 */

import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;

let waClient: InstanceType<typeof Client> | null = null;
let isReady = false;
let initPromise: Promise<void> | null = null;

/**
 * Normalisasi nomor telepon Indonesia ke format internasional WhatsApp.
 * WhatsApp menggunakan format: 6281234567890@c.us
 */
function normalizeToWhatsAppId(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  }
  if (!cleaned.startsWith("62")) {
    cleaned = "62" + cleaned;
  }
  return cleaned + "@c.us";
}

/**
 * Inisialisasi WhatsApp client. Hanya dipanggil sekali.
 */
function initClient(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = new Promise<void>((resolve) => {
    console.log("\n🟢 [WhatsApp Server] Memulai inisialisasi WhatsApp client...");

    waClient = new Client({
      authStrategy: new LocalAuth({
        dataPath: ".wwebjs_auth",
      }),
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--disable-gpu",
        ],
      },
    });

    waClient.on("qr", (qr: string) => {
      console.log("\n📱 [WhatsApp Server] Scan QR code berikut di WhatsApp Anda:");
      console.log("─".repeat(50));
      // Simple QR link log for terminal
      console.log(`[QR Code Data]: ${qr}`);
      console.log("─".repeat(50));
      console.log("💡 Buka WhatsApp > Linked Devices > Link a Device > Scan QR di atas\n");
    });

    waClient.on("ready", () => {
      isReady = true;
      console.log("✅ [WhatsApp Server] WhatsApp client siap! Pesan dapat dikirim otomatis.\n");
      resolve();
    });

    waClient.on("authenticated", () => {
      console.log("🔐 [WhatsApp Server] Autentikasi berhasil (sesi tersimpan).");
    });

    waClient.on("auth_failure", (msg: string) => {
      console.error("❌ [WhatsApp Server] Autentikasi gagal:", msg);
      isReady = false;
      resolve(); // resolve anyway so server doesn't hang
    });

    waClient.on("disconnected", (reason: string) => {
      console.warn("⚠️ [WhatsApp Server] Terputus:", reason);
      isReady = false;
      waClient = null;
      initPromise = null;
    });

    waClient.initialize().catch((err: unknown) => {
      console.error("❌ [WhatsApp Server] Gagal inisialisasi:", err);
      isReady = false;
      resolve(); // resolve anyway
    });
  });

  return initPromise;
}

/**
 * Kirim pesan WhatsApp ke nomor tujuan.
 * @returns Object { success, message, error? }
 */
export async function sendWhatsAppMessage(
  phone: string,
  message: string,
): Promise<{ success: boolean; message: string; error?: string }> {
  // Pastikan client sudah diinisialisasi
  await initClient();

  if (!waClient || !isReady) {
    return {
      success: false,
      message: "WhatsApp client belum terhubung. Silakan scan QR code di terminal server.",
      error: "CLIENT_NOT_READY",
    };
  }

  const chatId = normalizeToWhatsAppId(phone);

  try {
    // Cek apakah nomor terdaftar di WhatsApp
    const isRegistered = await waClient.isRegisteredUser(chatId);
    if (!isRegistered) {
      return {
        success: false,
        message: `Nomor ${phone} tidak terdaftar di WhatsApp.`,
        error: "NUMBER_NOT_REGISTERED",
      };
    }

    await waClient.sendMessage(chatId, message);
    console.log(`📤 [WhatsApp Server] Pesan terkirim ke ${phone}`);
    return {
      success: true,
      message: `Pesan berhasil dikirim ke ${phone}`,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`❌ [WhatsApp Server] Gagal kirim ke ${phone}:`, errorMsg);
    return {
      success: false,
      message: `Gagal mengirim pesan ke ${phone}`,
      error: errorMsg,
    };
  }
}

/**
 * Cek status koneksi WhatsApp client.
 */
export function getWhatsAppStatus(): { connected: boolean; message: string } {
  if (isReady && waClient) {
    return { connected: true, message: "WhatsApp client terhubung dan siap." };
  }
  return { connected: false, message: "WhatsApp client belum terhubung." };
}

/**
 * Inisialisasi WhatsApp client saat server start.
 * Dipanggil dari server entry point.
 */
export function bootstrapWhatsApp(): void {
  initClient().catch((err) => {
    console.error("❌ [WhatsApp Server] Bootstrap gagal:", err);
  });
}
