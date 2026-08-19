import { AlertTriangle, ShieldAlert } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type DeleteMode = "permanent" | "soft";

export interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  itemName?: string | undefined;
  description?: string;
  allowChoice?: boolean;
  onConfirm: (mode?: any) => void;
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title = "Konfirmasi Penghapusan Data",
  itemName,
  description,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const handleConfirm = () => {
    onConfirm("soft");
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md border-destructive/20 shadow-2xl animate-in fade-in-50 zoom-in-95">
        <AlertDialogHeader className="space-y-3">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive border border-destructive/20 shadow-sm">
            <AlertTriangle className="size-6 animate-pulse text-destructive" />
          </div>

          <AlertDialogTitle className="text-center text-lg font-bold text-foreground">
            {title}
          </AlertDialogTitle>

          <AlertDialogDescription className="text-center text-xs text-muted-foreground leading-relaxed">
            {description || (
              <>
                Apakah Anda yakin ingin menghapus data{" "}
                {itemName ? <strong className="text-foreground font-semibold">"{itemName}"</strong> : "ini"}?
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="pt-3 sm:space-x-2">
          <AlertDialogCancel className="h-9 text-xs font-medium">Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="h-9 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5 font-semibold shadow-md transition-all active:scale-95"
          >
            <ShieldAlert className="size-3.5" />
            <span>Ya, Hapus Data</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
