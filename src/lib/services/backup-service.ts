import { allRepos, hydrateAll, resetDemoData } from "@/lib/data/repositories";
import { SCHEMA_VERSION } from "@/lib/data/storage";

export type BackupData = {
  version: number;
  exportedAt: string;
  appName: string;
  collections: Record<string, unknown[]>;
};

export function exportFullDatabaseJSON(): void {
  hydrateAll();

  const collectionsData: Record<string, unknown[]> = {};
  for (const repo of allRepos) {
    collectionsData[repo.name] = repo.list();
  }

  const backup: BackupData = {
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    appName: "Griya Huffazh Quran - Upgrading Hub",
    collections: collectionsData,
  };

  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  a.download = `backup_ghq_upgrading_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importFullDatabaseJSON(jsonContent: string): { ok: true } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(jsonContent) as BackupData;

    if (!parsed || typeof parsed !== "object" || !parsed.collections) {
      return { ok: false, error: "Format berkas cadangan JSON tidak valid." };
    }

    // Replace each matching repository
    for (const repo of allRepos) {
      const rows = parsed.collections[repo.name];
      if (Array.isArray(rows)) {
        repo.replaceAll(rows as any);
      }
    }

    hydrateAll();
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Gagal memproses berkas JSON." };
  }
}

export function resetDatabaseToDemo(): void {
  resetDemoData();
}
