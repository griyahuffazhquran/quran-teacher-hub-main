const STORAGE_KEY = "ghq_gas_api_url";

export const DEFAULT_GAS_API_URL =
  "https://script.google.com/macros/s/AKfycbxjkSv0cAHRYDecKbyGsEKwoctLKm1Thi-S-fDnunwu7rvW-B2BA7dsyIWAU4MF33UD0w/exec";

export function getGasApiUrl(): string {
  return DEFAULT_GAS_API_URL;
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
