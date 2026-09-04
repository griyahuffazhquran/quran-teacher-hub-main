import { ZodError } from "zod";
import { backendCrudService } from "./services/crud-service";

const CORS_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS,
  });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ ok: false, error: message }, status);
}

export async function handleBackendApi(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const url = new URL(request.url);
  const pathname = url.pathname; // e.g. /api/db/teachers or /api/db/reports/rep_1

  // Base path check
  if (!pathname.startsWith("/api/db")) {
    return errorResponse("Endpoint tidak ditemukan", 404);
  }

  const relativePath = pathname.replace(/^\/api\/db\/?/, ""); // e.g. "teachers", "reports/rep_1", "auth/login"
  const segments = relativePath.split("/").filter(Boolean);

  if (segments.length === 0) {
    return jsonResponse({ ok: true, message: "Griya Huffazh Local Backend API is running" });
  }

  try {
    // 1. Auth Endpoint: POST /api/db/auth/login
    if (segments[0] === "auth" && segments[1] === "login" && request.method === "POST") {
      const body = (await request.json()) as { username?: string; password?: string };
      const user = await backendCrudService.login(body.username || "", body.password || "");
      return jsonResponse({ ok: true, user });
    }

    const collectionName = segments[0];
    const id = segments[1];

    // 2. GET /api/db/:collection (List with query filters)
    if (request.method === "GET" && !id) {
      const queryParams: Record<string, string> = {};
      url.searchParams.forEach((val, key) => {
        queryParams[key] = val;
      });
      const data = await backendCrudService.list(collectionName, queryParams);
      return jsonResponse({ ok: true, data });
    }

    // 3. GET /api/db/:collection/:id (Single Item)
    if (request.method === "GET" && id) {
      const item = await backendCrudService.getById(collectionName, id);
      return jsonResponse({ ok: true, data: item });
    }

    // 4. POST /api/db/:collection (Create)
    if (request.method === "POST" && !id) {
      const body = (await request.json()) as Record<string, any>;
      const created = await backendCrudService.create(collectionName, body);
      return jsonResponse({ ok: true, data: created }, 201);
    }

    // 5. PUT /api/db/:collection/:id (Update)
    if (request.method === "PUT" && id) {
      const body = (await request.json()) as Record<string, any>;
      const updated = await backendCrudService.update(collectionName, id, body);
      return jsonResponse({ ok: true, data: updated });
    }

    // 6. DELETE /api/db/:collection/:id (Delete)
    if (request.method === "DELETE" && id) {
      const result = await backendCrudService.remove(collectionName, id);
      return jsonResponse({ ok: true, data: result });
    }

    return errorResponse(`Method ${request.method} tidak didukung pada endpoint ini`, 405);
  } catch (err: any) {
    if (err instanceof ZodError) {
      const formattedErrors = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
      return errorResponse(`Validasi Gagal: ${formattedErrors}`, 400);
    }
    const status = err.message?.includes("tidak ditemukan") ? 404 : 400;
    return errorResponse(err?.message || "Terjadi kesalahan pada backend server", status);
  }
}
