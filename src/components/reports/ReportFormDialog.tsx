import { useEffect, useState } from "react";
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
import { gradeOptions, materialOptions } from "@/lib/data/selectors";
import type { Grade, MaterialType, Report, Teacher } from "@/lib/data/types";
import {
  createReport,
  updateReport,
  validateReport,
  type ReportInput,
} from "@/lib/services/report-service";

import { toInputDate } from "@/lib/utils";

const today = () => new Date().toISOString().slice(0, 10);

const emptyInput = (): ReportInput => ({
  date: today(),
  teacherId: "",
  material: "tahfizh",
  materialDetail: "",
  reference: "",
  grade: "A",
  homework: "",
  mustamiNote: "",
});

function fromReport(r: Report): ReportInput {
  return {
    date: toInputDate(r.date),
    teacherId: r.teacherId,
    material: r.material,
    materialDetail: r.materialDetail,
    reference: r.reference,
    grade: r.grade,
    homework: r.homework ?? "",
    mustamiNote: r.mustamiNote ?? "",
  };
}

export function ReportFormDialog({
  open,
  onOpenChange,
  currentUser,
  teachers,
  reports,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentUser: Teacher;
  teachers: Teacher[];
  reports: Report[];
  editing?: Report | undefined;
}) {
  const [form, setForm] = useState<ReportInput>(emptyInput);
  const [selectedMustamiId, setSelectedMustamiId] = useState<string>(currentUser.id);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(editing ? fromReport(editing) : emptyInput());
    setSelectedMustamiId(editing?.mustamiId || currentUser.id);
    setErrors({});
    setSaving(false);
  }, [open, editing, currentUser.id]);

  const set = <K extends keyof ReportInput>(key: K, value: ReportInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const activeTeachers = teachers.filter((t) => t.status === "aktif");
  const options = activeTeachers.filter((t) => t.id !== selectedMustamiId);

  const submit = async () => {
    if (saving) return;
    const mustamiUser = teachers.find((t) => t.id === selectedMustamiId) || currentUser;
    const result = validateReport(form, mustamiUser.id, reports, editing?.id);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setSaving(true);
    const assessedName = teachers.find((t) => t.id === form.teacherId)?.name ?? "guru";
    try {
      if (editing) {
        updateReport(editing.id, form, mustamiUser, assessedName);
        toast.success("Setoran diperbarui.");
      } else {
        createReport(form, mustamiUser, assessedName);
        toast.success(`Setoran ${assessedName} tersimpan.`);
      }
      onOpenChange(false);
    } catch {
      toast.error("Gagal menyimpan setoran.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Setoran" : "Setoran Baru"}</DialogTitle>
          <DialogDescription>
            {currentUser.role === "upgrader"
              ? "Anda sedang menginputkan/mengedit data setoran sebagai Upgrader/Pengurus."
              : `Anda tercatat sebagai Mustami': ${currentUser.name}`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {currentUser.role === "upgrader" && (
            <div className="grid gap-2">
              <Label>Mustami' (Guru Penyimak)</Label>
              <Select value={selectedMustamiId} onValueChange={setSelectedMustamiId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Mustami' (Penyimak)" />
                </SelectTrigger>
                <SelectContent>
                  {activeTeachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} {t.id === currentUser.id ? "(Saya)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="date">Tanggal</Label>
            <Input
              id="date"
              type="date"
              value={form.date}
              max={today()}
              onChange={(e) => set("date", e.target.value)}
            />
            {errors["date"] && <p className="text-xs text-destructive">{errors["date"]}</p>}
          </div>

          <div className="grid gap-2">
            <Label>Nama Ustadz/Ustadzah</Label>
            <Select value={form.teacherId} onValueChange={(v) => set("teacherId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih guru yang disimak" />
              </SelectTrigger>
              <SelectContent>
                {options.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors["teacherId"] && (
              <p className="text-xs text-destructive">{errors["teacherId"]}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Materi</Label>
              <Select
                value={form.material}
                onValueChange={(v) => set("material", v as MaterialType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {materialOptions.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Penilaian</Label>
              <Select value={form.grade} onValueChange={(v) => set("grade", v as Grade)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {gradeOptions.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="materialDetail">Rincian Materi</Label>
            <Input
              id="materialDetail"
              maxLength={160}
              placeholder="Contoh: Ziyadah Al-Baqarah"
              value={form.materialDetail}
              onChange={(e) => set("materialDetail", e.target.value)}
            />
            {errors["materialDetail"] && (
              <p className="text-xs text-destructive">{errors["materialDetail"]}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reference">Ayat/Hal./Juz</Label>
            <Input
              id="reference"
              maxLength={120}
              placeholder="Contoh: QS. Al-Baqarah 1-20"
              value={form.reference}
              onChange={(e) => set("reference", e.target.value)}
            />
            {errors["reference"] && (
              <p className="text-xs text-destructive">{errors["reference"]}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="homework">Catatan PR</Label>
            <Textarea
              id="homework"
              rows={2}
              maxLength={500}
              value={form.homework ?? ""}
              onChange={(e) => set("homework", e.target.value)}
            />
            {errors["homework"] && <p className="text-xs text-destructive">{errors["homework"]}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="mustamiNote">Catatan Mustami'</Label>
            <Textarea
              id="mustamiNote"
              rows={2}
              maxLength={500}
              value={form.mustamiNote ?? ""}
              onChange={(e) => set("mustamiNote", e.target.value)}
            />
            {errors["mustamiNote"] && (
              <p className="text-xs text-destructive">{errors["mustamiNote"]}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Batal
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan Setoran"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
