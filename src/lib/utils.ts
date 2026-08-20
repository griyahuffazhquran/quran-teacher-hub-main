import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Converts any date string (ISO timestamp, dd/mm/yyyy, Date string) into standard HTML input YYYY-MM-DD format */
export function toInputDate(val?: string | null): string {
  if (!val) return new Date().toISOString().slice(0, 10);
  const s = String(val).trim();
  if (!s) return new Date().toISOString().slice(0, 10);

  // If already YYYY-MM-DD (10 chars)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // If ISO string like 2026-08-20T14:30:00.000Z
  if (s.includes("T")) {
    const datePart = s.split("T")[0];
    if (datePart && /^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;
  }

  // If dd/mm/yyyy or dd-mm-yyyy
  const dmyMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1]!.padStart(2, "0");
    const month = dmyMatch[2]!.padStart(2, "0");
    const year = dmyMatch[3]!;
    return `${year}-${month}-${day}`;
  }

  // If yyyy/mm/dd
  const ymdMatch = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymdMatch) {
    const year = ymdMatch[1]!;
    const month = ymdMatch[2]!.padStart(2, "0");
    const day = ymdMatch[3]!.padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  try {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  } catch {
    // ignore
  }

  return s.slice(0, 10);
}
