const STORAGE_KEY = "ghq_gas_api_url";

export function getGasApiUrl(): string {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim();
  }
  return (import.meta.env["VITE_GAS_API_URL"] as string) || "";
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
