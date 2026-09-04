/**
 * Backend API Service Client
 * High-level API client for interacting with the backend REST API endpoints (/api/db/*).
 * All database operations from frontend go through this client.
 */

export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
  message?: string;
}

const API_BASE = "/api/db";

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  
  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  const json: ApiResponse<T> = await response.json();

  if (!response.ok || !json.ok) {
    throw new Error(json.error || `HTTP error ${response.status}`);
  }

  return json.data as T;
}

export const backendApiService = {
  /**
   * Fetch a list of items from a collection with optional filters
   */
  async list<T = any>(collection: string, params?: Record<string, string>): Promise<T[]> {
    let queryString = "";
    if (params && Object.keys(params).length > 0) {
      const search = new URLSearchParams(params);
      queryString = `?${search.toString()}`;
    }
    return request<T[]>(`/${collection}${queryString}`, { method: "GET" });
  },

  /**
   * Fetch a single item by ID
   */
  async getById<T = any>(collection: string, id: string): Promise<T | null> {
    try {
      return await request<T>(`/${collection}/${id}`, { method: "GET" });
    } catch (err: any) {
      if (err.message?.includes("tidak ditemukan") || err.message?.includes("404")) {
        return null;
      }
      throw err;
    }
  },

  /**
   * Create a new item in a collection
   */
  async create<T = any>(collection: string, item: Partial<T>): Promise<T> {
    return request<T>(`/${collection}`, {
      method: "POST",
      body: JSON.stringify(item),
    });
  },

  /**
   * Update an existing item by ID
   */
  async update<T = any>(collection: string, id: string, item: Partial<T>): Promise<T> {
    return request<T>(`/${collection}/${id}`, {
      method: "PUT",
      body: JSON.stringify(item),
    });
  },

  /**
   * Delete an item by ID
   */
  async remove(collection: string, id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/${collection}/${id}`, {
      method: "DELETE",
    });
  },

  /**
   * Login user credentials
   */
  async login(username: string, password?: string): Promise<any> {
    return request<any>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },
};
