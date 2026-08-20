import { useEffect, useState } from "react";
import { Calendar as CalendarIcon, Target as TargetIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Target, TargetPeriod, TargetStatus, Teacher } from "@/lib/data/types";
import { createTarget, updateTarget } from "@/lib/services/target-service";

import { toInputDate } from "@/lib/utils";

interface TargetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: Teacher;
  teachers: Teacher[];
  editing?: Target | undefined;
}

const defaultPeriodOptions: { value: TargetPeriod; label: string }[] = [
  { value: "bulanan", label: "Bulanan" },
  { value: "semester", label: "Semester" },
  { value: "tahunan", label: "Tahunan" },
];

const unitOptions = ["halaman", "juz", "surah", "sesi", "buku", "kali"];

export function TargetFormDialog({
  open,
  onOpenChange,
  currentUser,
  teachers,
  editing,
}: TargetFormDialogProps) {
  const isEditing = !!editing;

  // Form states
  const [teacherId, setTeacherId] = useState<string>(editing?.teacherId || currentUser.id);
  const [title, setTitle] = useState<string>(editing?.title || "");
  const [description, setDescription] = useState<string>(editing?.description || "");
  const [period, setPeriod] = useState<TargetPeriod>(editing?.period || "bulanan");
  const [status, setStatus] = useState<TargetStatus>(editing?.status || "aktif");
  const [startDate, setStartDate] = useState<string>(
    toInputDate(editing?.startDate),
  );
  const [dueDate, setDueDate] = useState<string>(
    toInputDate(editing?.dueDate),
  );
  const [targetValue, setTargetValue] = useState<string>(editing ? String(editing.targetValue) : "20");
  const [currentValue, setCurrentValue] = useState<string>(editing ? String(editing.currentValue) : "0");
  const [unit, setUnit] = useState<string>(editing?.unit || "halaman");

  // Reset or fill form when editing changes
  useEffect(() => {
    if (editing) {
      setTeacherId(editing.teacherId);
      setTitle(editing.title);
      setDescription(editing.description || "");
      setPeriod(editing.period);
      setStatus(editing.status);
      setStartDate(toInputDate(editing.startDate));
      setDueDate(toInputDate(editing.dueDate));
      setTargetValue(String(editing.targetValue));
      setCurrentValue(String(editing.currentValue));
      setUnit(editing.unit);
    } else {
      setTeacherId(currentUser.id);
      setTitle("");
      setDescription("");
      setPeriod("bulanan");
      setStatus("aktif");
      setStartDate(new Date().toISOString().slice(0, 10));
      const defaultDue = new Date();
      defaultDue.setDate(defaultDue.getDate() + 30);
      setDueDate(defaultDue.toISOString().slice(0, 10));
      setTargetValue("20");
      setCurrentValue("0");
      setUnit("halaman");
    }
  }, [editing, currentUser.id, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Judul target tidak boleh kosong.");
      return;
    }

    const tVal = Number(targetValue);
    if (isNaN(tVal) || tVal <= 0) {
      toast.error("Nilai target harus berupa angka lebih dari 0.");
      return;
    }

    const cVal = Number(currentValue) || 0;

    if (isEditing && editing) {
      updateTarget(
        editing.id,
        {
          teacherId,
          title: title.trim(),
          description: description.trim() || undefined,
          period,
          status,
          startDate,
          dueDate,
          targetValue: tVal,
          currentValue: cVal,
          unit: unit.trim() || "halaman",
        },
        currentUser.id,
      );
      toast.success("Target upgrading berhasil diperbarui.");
    } else {
      createTarget(
        {
          teacherId,
          title: title.trim(),
          description: description.trim() || undefined,
          period,
          startDate,
          dueDate,
          targetValue: tVal,
          currentValue: cVal,
          unit: unit.trim() || "halaman",
        },
        currentUser.id,
      );
      toast.success("Target upgrading baru berhasil ditambahkan!");
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <TargetIcon className="size-5 text-primary" />
              {isEditing ? "Edit Target Upgrading" : "Buat Target Upgrading Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Tentukan sasaran pencapaian hafalan/studi upgrading untuk pengajar.
            </DialogDescription>
          </DialogHeader>

          {/* Form Controls */}
          <div className="space-y-3.5 pt-1">
            {/* Teacher selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Pengajar / Guru</Label>
              <Select value={teacherId} onValueChange={setTeacherId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Pilih Pengajar" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target Title */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Judul Target</Label>
              <Input
                placeholder="Contoh: Ziyadah Juz 21, Murojaah Juz 1-5, Matn Jazariyah"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Deskripsi / Catatan Tambahan (Opsional)</Label>
              <Textarea
                placeholder="Tuliskan rincian atau standar pencapaian yang diharapkan..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs min-h-[60px] resize-none"
              />
            </div>

            {/* Period & Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Periode Target</Label>
                <Select value={period} onValueChange={(v) => setPeriod(v as TargetPeriod)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Pilih Periode" />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultPeriodOptions.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Satuan Target</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Satuan" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOptions.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Values: Target Value & Current Progress */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Total Target ({unit})</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="20"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Progres Saat Ini ({unit})</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={currentValue}
                  onChange={(e) => setCurrentValue(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Dates: Start Date & Due Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1">
                  <CalendarIcon className="size-3 text-muted-foreground" /> Tanggal Mulai
                </Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1">
                  <CalendarIcon className="size-3 text-muted-foreground" /> Tenggat (Due Date)
                </Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>
            </div>

            {/* Status (when editing) */}
            {isEditing && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Status Target</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as TargetStatus)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Status Target" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aktif">Aktif (Sedang Berjalan)</SelectItem>
                    <SelectItem value="tercapai">Tercapai (Tuntas)</SelectItem>
                    <SelectItem value="gagal">Gagal / Kadaluwarsa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs h-9"
            >
              Batal
            </Button>
            <Button type="submit" className="text-xs h-9 font-medium">
              {isEditing ? "Simpan Perubahan" : "Buat Target"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
