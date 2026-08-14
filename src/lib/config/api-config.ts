const STORAGE_KEY = "ghq_gas_api_url";

export const DEFAULT_GAS_API_URL =
  "https://script.google.com/macros/s/AKfycbwP0G7RhAXN1HAejJbqloLmkVuXckqZMGXwoi9szmalGRa90E5HAOrQQqoE72NQ1R2yRQ/exec";

export function getGasApiUrl(): string {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim();
  }
  return (import.meta.env["VITE_GAS_API_URL"] as string) || DEFAULT_GAS_API_URL;
}

export function setGasApiUrl(url: string): void {
  if (typeof window !== "undefined") {
    if (url && url.trim()) {
      localStorage.setItem(STORAGE_KEY, url.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}

export function isGasApiConfigured(): boolean {
  return getGasApiUrl().length > 0;
}
