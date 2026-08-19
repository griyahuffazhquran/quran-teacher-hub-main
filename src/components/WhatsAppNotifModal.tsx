import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Check, Copy, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  SetoranNotificationData,
  formatWhatsAppSetoranMessage,
  sendWhatsAppNotifSetoran,
} from "@/lib/whatsapp";

interface WhatsAppNotifModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: SetoranNotificationData[];
  title?: string;
  description?: string;
}

export const WhatsAppNotifModal: React.FC<WhatsAppNotifModalProps> = ({
  open,
  onOpenChange,
  items,
  title = "Kirim Notifikasi Setoran via WhatsApp",
  description = "Penguji B dapat langsung mengirim laporan hasil setoran hafalan kepada Peserta/Santri A secara otomatis.",
}) => {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);
  const [sendingIndex, setSendingIndex] = React.useState<number | null>(null);
  const [sentIndexes, setSentIndexes] = React.useState<Set<number>>(new Set());
  const [sendingAll, setSendingAll] = React.useState(false);

  if (!items || items.length === 0) return null;

  const handleSendSingle = async (item: SetoranNotificationData, index: number) => {
    if (!item.nomorWaPeserta) {
      toast.error(`Nomor WhatsApp untuk ${item.namaPeserta} belum diisi.`);
      return;
    }
    setSendingIndex(index);
    const result = await sendWhatsAppNotifSetoran(item);
    setSendingIndex(null);

    if (result.success) {
      setSentIndexes((prev) => new Set(prev).add(index));
      toast.success(`✅ Notifikasi WhatsApp terkirim ke ${item.namaPeserta}!`);
    } else {
      toast.error(`⚠️ ${result.message}`);
    }
  };

  const handleCopyText = (item: SetoranNotificationData, index: number) => {
    const text = formatWhatsAppSetoranMessage(item);
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success(`Format pesan ${item.namaPeserta} berhasil disalin!`);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSendAllBatch = async () => {
    setSendingAll(true);
    let successCount = 0;
    let failCount = 0;

    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      if (!item || !item.nomorWaPeserta || sentIndexes.has(idx)) continue;

      setSendingIndex(idx);
      const result = await sendWhatsAppNotifSetoran(item);
      setSendingIndex(null);

      if (result.success) {
        setSentIndexes((prev) => new Set(prev).add(idx));
        successCount++;
      } else {
        failCount++;
      }
    }

    setSendingAll(false);
    if (successCount > 0) {
      toast.success(`✅ ${successCount} notifikasi WhatsApp berhasil terkirim!`);
    }
    if (failCount > 0) {
      toast.error(`⚠️ ${failCount} notifikasi gagal terkirim.`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading text-lg font-bold text-emerald-700 dark:text-emerald-400">
            <MessageSquare className="size-5 text-emerald-600 animate-bounce" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {items.map((item, index) => {
            const previewMsg = formatWhatsAppSetoranMessage(item);
            const isSending = sendingIndex === index;
            const isSent = sentIndexes.has(index);

            return (
              <div
                key={index}
                className="rounded-lg border border-emerald-200 dark:border-emerald-950 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{item.namaPeserta}</span>
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-white dark:bg-zinc-900 border-emerald-300"
                      >
                        {item.nomorWaPeserta || "No HP / WA Belum Ada"}
                      </Badge>
                      {isSent && (
                        <Badge className="text-[10px] bg-emerald-600">
                          <Check className="mr-1 size-3" /> Terkirim
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Setoran:{" "}
                      <span className="font-semibold text-foreground">
                        {item.namaSurah} ({item.ayatAwal}-{item.ayatAkhir})
                      </span>{" "}
                      &bull; Nilai:{" "}
                      <Badge className="text-[10px] bg-emerald-600">{item.nilai}</Badge>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8"
                      onClick={() => handleCopyText(item, index)}
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="mr-1 size-3 text-emerald-600" /> Disalin
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1 size-3" /> Salin Pesan
                        </>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 shadow-sm"
                      onClick={() => handleSendSingle(item, index)}
                      disabled={isSending || isSent || sendingAll}
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="mr-1.5 size-3 animate-spin" />
                          Mengirim...
                        </>
                      ) : isSent ? (
                        <>
                          <Check className="mr-1.5 size-3" />
                          Terkirim
                        </>
                      ) : (
                        <>
                          <Send className="mr-1.5 size-3" />
                          Kirim Otomatis
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Preview Box */}
                <div className="rounded-md bg-white dark:bg-zinc-900 border border-border/70 p-3 text-xs font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                  {previewMsg}
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between items-center border-t pt-3">
          <p className="text-[11px] text-muted-foreground text-center sm:text-left">
            💡 <em>Pesan dikirim otomatis via WhatsApp dari nomor Superadmin.</em>
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs w-full sm:w-auto"
            >
              Tutup
            </Button>
            {items.length > 1 && (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs w-full sm:w-auto"
                onClick={handleSendAllBatch}
                disabled={sendingAll || sentIndexes.size === items.length}
              >
                {sendingAll ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send className="mr-1.5 size-3.5" />
                    Kirim Semua ({items.length} Peserta)
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
