import { targetRepo, teacherRepo } from "@/lib/data/repositories";
import type { Target, TargetPeriod, TargetStatus } from "@/lib/data/types";
import { logActivity, notify } from "./notification-service";

export type CreateTargetInput = {
  teacherId: string;
  title: string;
  description?: string | undefined;
  period: TargetPeriod;
  startDate: string;
  dueDate: string;
  targetValue: number;
  currentValue?: number | undefined;
  unit: string;
};

export type UpdateTargetInput = Partial<CreateTargetInput> & {
  status?: TargetStatus | undefined;
};

export function listActiveTargets(targets: Target[]): Target[] {
  return targets
    .filter((t) => !t.isDeleted)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function targetsForTeacher(targets: Target[], teacherId: string): Target[] {
  return listActiveTargets(targets).filter((t) => t.teacherId === teacherId);
}

export function createTarget(input: CreateTargetInput, creatorId?: string): Target {
  const currentValue = input.currentValue ?? 0;
  const isReached = currentValue >= input.targetValue && input.targetValue > 0;
  const status: TargetStatus = isReached ? "tercapai" : "aktif";

  const target = targetRepo.create({
    teacherId: input.teacherId,
    title: input.title,
    period: input.period,
    status,
    startDate: input.startDate,
    dueDate: input.dueDate,
    targetValue: input.targetValue,
    currentValue,
    unit: input.unit,
    ...(input.description ? { description: input.description } : {}),
    ...(creatorId ? { createdBy: creatorId } : {}),
  });

  const teacher = teacherRepo.get(input.teacherId);
  const teacherName = teacher?.name ?? "Pengajar";

  notify({
    title: "Target Upgrading Baru",
    body: `Target "${target.title}" (${target.targetValue} ${target.unit}) ditetapkan untuk ${teacherName}.`,
    level: "info",
    type: "TARGET_CREATED",
    userId: input.teacherId,
    targetId: target.id,
  });

  logActivity({
    action: "TARGET_CREATED",
    description: `Target "${target.title}" ditetapkan untuk ${teacherName}.`,
    ...(creatorId ? { actorId: creatorId } : {}),
    entity: "targets",
    entityId: target.id,
  });

  return target;
}

export function updateTarget(
  id: string,
  input: UpdateTargetInput,
  actorId?: string,
): Target | undefined {
  const existing = targetRepo.get(id);
  if (!existing) return undefined;

  const targetVal = input.targetValue ?? existing.targetValue;
  const currentVal = input.currentValue ?? existing.currentValue;
  let status = input.status ?? existing.status;

  if (currentVal >= targetVal && targetVal > 0) {
    status = "tercapai";
  }

  const updated = targetRepo.update(id, {
    ...(input.teacherId ? { teacherId: input.teacherId } : {}),
    ...(input.title ? { title: input.title } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.period ? { period: input.period } : {}),
    ...(input.startDate ? { startDate: input.startDate } : {}),
    ...(input.dueDate ? { dueDate: input.dueDate } : {}),
    ...(input.targetValue !== undefined ? { targetValue: input.targetValue } : {}),
    ...(input.currentValue !== undefined ? { currentValue: input.currentValue } : {}),
    ...(input.unit ? { unit: input.unit } : {}),
    status,
  });

  if (updated) {
    logActivity({
      action: "TARGET_UPDATED",
      description: `Target "${updated.title}" diperbarui.`,
      ...(actorId ? { actorId } : {}),
      entity: "targets",
      entityId: updated.id,
    });
  }

  return updated;
}

export function updateTargetProgress(
  id: string,
  newProgress: number,
  actorId?: string,
): Target | undefined {
  const target = targetRepo.get(id);
  if (!target) return undefined;

  const isCompleted = newProgress >= target.targetValue && target.targetValue > 0;
  const status: TargetStatus = isCompleted ? "tercapai" : "aktif";

  const updated = targetRepo.update(id, {
    currentValue: newProgress,
    status,
  });

  if (updated) {
    if (isCompleted && target.status !== "tercapai") {
      notify({
        title: "Target Upgrading Tercapai! 🎉",
        body: `Selamat! Target "${updated.title}" telah tuntas diselesaikan (${updated.currentValue}/${updated.targetValue} ${updated.unit}).`,
        level: "success",
        type: "TARGET_COMPLETED",
        userId: updated.teacherId,
        targetId: updated.id,
      });

      logActivity({
        action: "TARGET_COMPLETED",
        description: `Target "${updated.title}" berhasil dicapai (${updated.currentValue}/${updated.targetValue} ${updated.unit}).`,
        ...(actorId ? { actorId } : {}),
        entity: "targets",
        entityId: updated.id,
      });
    } else {
      logActivity({
        action: "TARGET_UPDATED",
        description: `Progres target "${updated.title}" diperbarui menjadi ${updated.currentValue}/${updated.targetValue} ${updated.unit}.`,
        ...(actorId ? { actorId } : {}),
        entity: "targets",
        entityId: updated.id,
      });
    }
  }

  return updated;
}

export function softDeleteTarget(id: string, actorId?: string): void {
  const target = targetRepo.get(id);
  if (!target) return;

  targetRepo.update(id, { isDeleted: true });

  logActivity({
    action: "TARGET_DELETED",
    description: `Target "${target.title}" dihapus.`,
    ...(actorId ? { actorId } : {}),
    entity: "targets",
    entityId: id,
  });
}
