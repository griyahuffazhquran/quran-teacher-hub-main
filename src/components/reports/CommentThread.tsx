import { useState } from "react";
import { MessageSquare, Send, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCollection } from "@/hooks/use-repository";
import { commentRepo } from "@/lib/data/repositories";
import type { Report, Teacher } from "@/lib/data/types";
import {
  createComment,
  deleteComment,
  listCommentsForReport,
} from "@/lib/services/comment-service";

export function CommentThread({
  report,
  currentUser,
}: {
  report: Report;
  currentUser?: Teacher | undefined;
}) {
  const { rows: allComments } = useCollection(commentRepo);
  const comments = listCommentsForReport(allComments, report.id);

  const [text, setText] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!text.trim()) return;

    const result = createComment({
      reportId: report.id,
      author: currentUser,
      content: text,
    });

    if ("error" in result) {
      toast.error(result.error);
    } else {
      setText("");
    }
  };

  const handleDelete = (id: string) => {
    if (!currentUser) return;
    if (deleteComment(id, currentUser)) {
      toast.success("Komentar dihapus.");
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <MessageSquare className="size-3.5 text-blue-500" /> Diskusi Setoran ({comments.length})
      </h4>

      {comments.length === 0 ? (
        <p className="text-xs text-muted-foreground italic bg-muted/30 p-3 rounded-lg border border-border/50 text-center">
          Belum ada komentar. Mulai percakapan mengenai setoran ini.
        </p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {comments.map((c) => {
            const initials = c.authorName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2);

            const isMe = currentUser?.id === c.authorId;

            return (
              <div
                key={c.id}
                className={`group flex items-start gap-2.5 p-2.5 rounded-xl border border-border/60 ${
                  isMe ? "bg-primary/5 ml-4" : "bg-card mr-4"
                }`}
              >
                <Avatar className="size-7 border shrink-0">
                  <AvatarFallback className="text-[10px] font-bold bg-muted">
                    {initials || <User className="size-3" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-xs text-foreground truncate">
                      {c.authorName} {isMe && <span className="text-[10px] text-muted-foreground font-normal">(Anda)</span>}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {new Date(c.createdAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {currentUser && (isMe || currentUser.role === "upgrader") && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                          onClick={() => handleDelete(c.id)}
                          title="Hapus komentar"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-line">
                    {c.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {currentUser ? (
        <form onSubmit={handleSend} className="flex items-center gap-2 pt-2 border-t border-border">
          <Input
            placeholder="Tulis komentar atau pertanyaan..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="text-xs h-9"
          />
          <Button size="sm" type="submit" disabled={!text.trim()} className="h-9 px-3 shrink-0">
            <Send className="size-3.5" />
          </Button>
        </form>
      ) : (
        <p className="text-xs text-muted-foreground text-center">Silakan masuk untuk menulis komentar.</p>
      )}
    </div>
  );
}
