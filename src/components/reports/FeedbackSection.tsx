import { useState } from "react";
import { MessageSquarePlus, MessageSquareText, ShieldCheck, Trash2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useCollection } from "@/hooks/use-repository";
import { feedbackRepo } from "@/lib/data/repositories";
import type { Report, Teacher } from "@/lib/data/types";
import {
  createFeedback,
  deleteFeedback,
  listFeedbacksForReport,
} from "@/lib/services/feedback-service";

export function FeedbackSection({
  report,
  currentUser,
}: {
  report: Report;
  currentUser?: Teacher | undefined;
}) {
  const { rows: allFeedbacks } = useCollection(feedbackRepo);
  const feedbacks = listFeedbacksForReport(allFeedbacks, report.id);

  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canAddFeedback =
    currentUser &&
    (currentUser.role === "upgrader" || currentUser.id === report.mustamiId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!content.trim()) {
      toast.error("Isi feedback tidak boleh kosong.");
      return;
    }

    setSubmitting(true);
    const result = createFeedback({
      reportId: report.id,
      author: currentUser,
      content,
    });

    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Feedback berhasil ditambahkan.");
      setContent("");
    }
    setSubmitting(false);
  };

  const [deleteFeedbackId, setDeleteFeedbackId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <MessageSquareText className="size-3.5 text-primary" /> Catatan Feedback & Evaluasi ({feedbacks.length})
        </h4>
      </div>

      {feedbacks.length === 0 ? (
        <p className="text-xs text-muted-foreground italic bg-muted/30 p-3 rounded-lg border border-border/50 text-center">
          Belum ada feedback resmi untuk setoran ini.
        </p>
      ) : (
        <div className="space-y-2.5">
          {feedbacks.map((fb) => (
            <div
              key={fb.id}
              className="group relative rounded-xl border border-border bg-card p-3 shadow-2xs space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-xs text-foreground">{fb.authorName}</span>
                  {fb.type === "upgrader" ? (
                    <Badge variant="default" className="text-[10px] px-1.5 py-0 gap-1 bg-emerald-600">
                      <ShieldCheck className="size-3" /> Upgrader
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                      <UserCheck className="size-3" /> Mustami'
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(fb.createdAt).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {currentUser && (currentUser.id === fb.authorId || currentUser.role === "upgrader") && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-6 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                      onClick={() => setDeleteFeedbackId(fb.id)}
                      title="Hapus feedback"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-line bg-muted/40 p-2 rounded-lg">
                {fb.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {canAddFeedback && (
        <form onSubmit={handleSubmit} className="space-y-2 pt-2 border-t border-border">
          <Textarea
            placeholder={
              currentUser.role === "upgrader"
                ? "Berikan catatan evaluasi resmi dari Upgrader..."
                : "Berikan rincian feedback sebagai Mustami'..."
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={2}
            className="text-xs resize-none"
          />
          <div className="flex justify-end">
            <Button size="sm" type="submit" disabled={submitting} className="text-xs gap-1.5">
              <MessageSquarePlus className="size-3.5" /> Kirim Feedback
            </Button>
          </div>
        </form>
      )}

      {/* Confirm Delete Feedback Modal */}
      <ConfirmDeleteDialog
        open={!!deleteFeedbackId}
        onOpenChange={(open) => !open && setDeleteFeedbackId(null)}
        title="Konfirmasi Hapus Feedback"
        description="Apakah Anda yakin ingin menghapus catatan feedback ini?"
        onConfirm={() => {
          if (deleteFeedbackId && currentUser) {
            if (deleteFeedback(deleteFeedbackId, currentUser)) {
              toast.success("Feedback berhasil dihapus.");
            }
            setDeleteFeedbackId(null);
          }
        }}
      />
    </div>
  );
}
