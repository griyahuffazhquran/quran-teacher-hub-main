import { useMemo, useState } from "react";
import {
  Bell,
  BookCheck,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Target as TargetIcon,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, materialLabel, teacherName } from "@/lib/data/selectors";
import type { Reminder, Report, Target, Teacher } from "@/lib/data/types";

interface UpgradeCalendarProps {
  reports: Report[];
  targets: Target[];
  reminders: Reminder[];
  teachers: Teacher[];
  onSelectReport?: ((report: Report) => void) | undefined;
  onSelectTarget?: ((target: Target) => void) | undefined;
}

export function UpgradeCalendar({
  reports,
  targets,
  reminders,
  teachers,
  onSelectReport,
  onSelectTarget,
}: UpgradeCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [month, setMonth] = useState<Date>(new Date());

  const selectedISO = useMemo(() => {
    if (!selectedDate) return new Date().toISOString().slice(0, 10);
    return selectedDate.toISOString().slice(0, 10);
  }, [selectedDate]);

  // Aggregate events by ISO date
  const eventsByDate = useMemo(() => {
    const map = new Map<
      string,
      { reports: Report[]; targets: Target[]; reminders: Reminder[] }
    >();

    const getOrCreate = (d: string) => {
      if (!map.has(d)) {
        map.set(d, { reports: [], targets: [], reminders: [] });
      }
      return map.get(d)!;
    };

    // Reports
    for (const r of reports) {
      if (r.date) getOrCreate(r.date.slice(0, 10)).reports.push(r);
    }

    // Target Due Dates
    for (const t of targets) {
      if (t.dueDate) getOrCreate(t.dueDate.slice(0, 10)).targets.push(t);
    }

    // Reminders
    for (const rm of reminders) {
      if (rm.remindAt) getOrCreate(rm.remindAt.slice(0, 10)).reminders.push(rm);
    }

    return map;
  }, [reports, targets, reminders]);

  // Events for selected date
  const selectedEvents = useMemo(() => {
    return eventsByDate.get(selectedISO) || { reports: [], targets: [], reminders: [] };
  }, [eventsByDate, selectedISO]);

  const totalSelectedEvents =
    selectedEvents.reports.length +
    selectedEvents.targets.length +
    selectedEvents.reminders.length;

  // Custom modifiers for daypicker
  const modifiers = useMemo(() => {
    const reportDates: Date[] = [];
    const targetDates: Date[] = [];
    const reminderDates: Date[] = [];

    eventsByDate.forEach((val, key) => {
      const date = new Date(key);
      if (val.reports.length > 0) reportDates.push(date);
      if (val.targets.length > 0) targetDates.push(date);
      if (val.reminders.length > 0) reminderDates.push(date);
    });

    return {
      hasReport: reportDates,
      hasTarget: targetDates,
      hasReminder: reminderDates,
    };
  }, [eventsByDate]);

  return (
    <div className="grid gap-4 lg:grid-cols-12 animate-fade-up">
      {/* Calendar Picker Column */}
      <Card className="lg:col-span-5 border-border shadow-xs">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-1.5">
            <CalendarIcon className="size-4 text-primary" /> Kalender Upgrading
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-7 text-xs"
              onClick={() => {
                const prev = new Date(month);
                prev.setMonth(prev.getMonth() - 1);
                setMonth(prev);
              }}
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-7 text-xs"
              onClick={() => {
                const next = new Date(month);
                next.setMonth(next.getMonth() + 1);
                setMonth(next);
              }}
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={month}
            onMonthChange={setMonth}
            modifiers={modifiers}
            modifiersClassNames={{
              hasReport: "font-bold text-emerald-600 dark:text-emerald-400 underline decoration-emerald-500",
              hasTarget: "font-bold text-amber-600 dark:text-amber-400",
              hasReminder: "font-bold text-indigo-600 dark:text-indigo-400",
            }}
            className="rounded-md border-0 p-0"
          />
        </CardContent>

        {/* Legend */}
        <div className="p-3 border-t border-border bg-muted/30 text-[11px] flex items-center justify-around gap-2 flex-wrap text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-emerald-500" /> Setoran Guru
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-amber-500" /> Tenggat Target
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-indigo-500" /> Reminder
          </span>
        </div>
      </Card>

      {/* Selected Day Agenda Column */}
      <Card className="lg:col-span-7 border-border shadow-xs">
        <CardHeader className="pb-2 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-foreground">
                Agenda {formatDate(selectedISO)}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {totalSelectedEvents > 0
                  ? `${totalSelectedEvents} aktivitas terjadwal pada tanggal ini.`
                  : "Tidak ada jadwal aktivitas setoran atau tenggat target."}
              </p>
            </div>
            {totalSelectedEvents > 0 && (
              <Badge variant="secondary" className="px-2 py-0.5 text-xs font-semibold">
                {totalSelectedEvents} Agenda
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3.5 max-h-[480px] overflow-y-auto">
          {totalSelectedEvents === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              <Sparkles className="mx-auto size-8 text-muted-foreground/40 mb-2" />
              <p>Belum ada agenda pada tanggal ini.</p>
              <p className="text-[11px] text-muted-foreground/70 mt-1">
                Pilih tanggal bertanda di kalender untuk melihat rincian setoran atau target.
              </p>
            </div>
          ) : (
            <>
              {/* Reports List */}
              {selectedEvents.reports.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <BookCheck className="size-3.5 text-emerald-500" /> Setoran Guru ({selectedEvents.reports.length})
                  </span>
                  {selectedEvents.reports.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => onSelectReport?.(r)}
                      className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 hover:border-emerald-500/60 transition-all cursor-pointer space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs text-foreground">
                          {r.materialDetail} ({r.reference})
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          Nilai {r.grade}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="size-3 text-emerald-600 dark:text-emerald-400" />
                        <span>{teacherName(teachers, r.teacherId)} • Mustami: {r.mustamiName}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Targets List */}
              {selectedEvents.targets.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <TargetIcon className="size-3.5 text-amber-500" /> Tenggat Target ({selectedEvents.targets.length})
                  </span>
                  {selectedEvents.targets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => onSelectTarget?.(t)}
                      className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20 hover:border-amber-500/60 transition-all cursor-pointer space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs text-foreground">{t.title}</span>
                        <Badge variant="secondary" className="text-[10px] capitalize">
                          {t.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {teacherName(teachers, t.teacherId)} • Target: {t.currentValue}/{t.targetValue} {t.unit}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reminders List */}
              {selectedEvents.reminders.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Bell className="size-3.5 text-indigo-500" /> Pengingat / Reminder ({selectedEvents.reminders.length})
                  </span>
                  {selectedEvents.reminders.map((rm) => (
                    <div
                      key={rm.id}
                      className="p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-950/20 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">{rm.title}</span>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {rm.frequency}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground leading-snug">{rm.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
