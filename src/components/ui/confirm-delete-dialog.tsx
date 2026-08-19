import { useState } from "react";
import { AlertTriangle, Trash2, Database, ShieldAlert } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export type DeleteMode = "permanent" | "soft";

export interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  itemName?: string | undefined;
  description?: string;
  allowChoice?: boolean;
  onConfirm: (mode: DeleteMode) => void;
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title = "Konfirmasi Penghapusan Data",
  itemName,
  description,
  allowChoice = true,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const [deleteMode, setDeleteMode] = useState<DeleteMode>("permanent");

  const handleConfirm = () => {
    onConfirm(deleteMode);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md border-destructive/20 shadow-2xl">
        <AlertDialogHeader className="space-y-3">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive border border-destructive/20">
            <AlertTriangle className="size-6 animate-pulse" />
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

        {allowChoice && (
          <div className="space-y-2 py-2 border-y border-border/60 my-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Opsi Penghapusan (Select Case):
            </p>
            <RadioGroup
              value={deleteMode}
              onValueChange={(val) => setDeleteMode(val as DeleteMode)}
              className="grid gap-2 text-xs"
            >
              <div className="flex items-start space-x-3 rounded-lg border border-destructive/30 p-2.5 bg-destructive/5 cursor-pointer hover:bg-destructive/10 transition-colors">
                <RadioGroupItem value="permanent" id="mode-permanent" className="mt-0.5 text-destructive" />
                <div className="space-y-0.5">
                  <Label htmlFor="mode-permanent" className="font-semibold text-destructive cursor-pointer flex items-center gap-1.5 text-xs">
                    <Trash2 className="size-3.5" /> Hapus Bersih Permanen (Clear Database)
                  </Label>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    Baris di database & backend langsung dibersihkan/dicut rapi. Data hilang selamanya.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 rounded-lg border border-border p-2.5 bg-muted/40 cursor-pointer hover:bg-accent transition-colors">
                <RadioGroupItem value="soft" id="mode-soft" className="mt-0.5" />
                <div className="space-y-0.5">
                  <Label htmlFor="mode-soft" className="font-semibold text-foreground cursor-pointer flex items-center gap-1.5 text-xs">
                    <Database className="size-3.5 text-muted-foreground" /> Arsipkan Data (Soft Delete)
                  </Label>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    Menandai status sebagai dihapus tanpa membuang histori audit fisik database.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>
        )}

        <AlertDialogFooter className="pt-2 sm:space-x-2">
          <AlertDialogCancel className="h-9 text-xs">Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="h-9 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5 font-semibold"
          >
            <ShieldAlert className="size-3.5" />
            <span>Ya, Hapus Data</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
