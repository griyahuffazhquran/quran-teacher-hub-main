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
import type { Teacher } from "@/lib/data/types";
import {
  createTeacher,
  emptyTeacherInput,
  toInput,
  updateTeacher,
  validateTeacher,
  type TeacherInput,
} from "@/lib/services/teacher-service";

export function TeacherFormDialog({
  open,
  onOpenChange,
  teacher,
  teachers,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  teacher?: Teacher | null;
  teachers: Teacher[];
}) {
  const [form, setForm] = useState<TeacherInput>(emptyTeacherInput);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(teacher ? toInput(teacher) : emptyTeacherInput());
      setErrors({});
      setSaving(false);
    }
  }, [open, teacher]);

  const set = <K extends keyof TeacherInput>(key: K, value: TeacherInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = () => {
    const result = validateTeacher(form, teachers, teacher?.id);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setSaving(true);
    if (teacher) {
      updateTeacher(teacher.id, form);
      toast.success("Data guru diperbarui.");
    } else {
      createTeacher(form);
      toast.success("Guru baru ditambahkan.");
    }
    setSaving(false);
    onOpenChange(false);
  };

  const field = (key: keyof TeacherInput, label: string, placeholder?: string, type = "text") => (
    <div className="space-y-2">
      <Label htmlFor={key}>{label}</Label>
      <Input
        id={key}
        type={type}
        value={(form[key] as string) ?? ""}
        placeholder={placeholder}
        onChange={(e) => set(key, e.target.value as TeacherInput[typeof key])}
      />
      {errors[key] && <p className="text-xs text-destructive">{errors[key]}</p>}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{teacher ? "Edit Guru" : "Tambah Guru"}</DialogTitle>
          <DialogDescription>
            Data disimpan melalui lapisan repository, bukan langsung ke storage.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">{field("name", "Nama", "Ust. Ahmad Fauzan")}</div>
          {field("username", "Username", "ahmad.fauzan")}
          <div className="space-y-2">
            <Label htmlFor="password">Password Default</Label>
            <Input
              id="password"
              type="text"
              value={form.password || "12345"}
              readOnly
              disabled
              className="bg-muted text-muted-foreground font-mono cursor-not-allowed"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={form.role} onValueChange={(v) => set("role", v as TeacherInput["role"])}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="upgrader">Upgrader</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Panggilan</Label>
            <Select
              value={form.gender}
              onValueChange={(v) => set("gender", v as TeacherInput["gender"])}
            >
              <SelectTrigger id="gender">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ustadz">Ustadz</SelectItem>
                <SelectItem value="ustadzah">Ustadzah</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => set("status", v as TeacherInput["status"])}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aktif">Aktif</SelectItem>
                <SelectItem value="nonaktif">Nonaktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {field("position", "Jabatan", "Guru Tahfizh")}
          {field("specialization", "Spesialisasi", "Tahfizh Al-Qur'an")}
          {field("level", "Level", "Juz 20")}
          {field("phone", "No. HP", "0812-0000-0000")}
          <div className="sm:col-span-2">
            {field("photoUrl", "URL Foto (opsional)", "https://...")}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
