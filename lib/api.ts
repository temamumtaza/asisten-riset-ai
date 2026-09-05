import { randomUUID } from "node:crypto";

export interface ApiError {
  code: string;
  message: string;
  details?: string[];
}

export interface ApiMeta {
  requestId: string;
  [key: string]: unknown;
}

export interface ApiEnvelope<T> {
  data: T | null;
  error: ApiError | null;
  meta: ApiMeta;
}

export function createApiResponse<T>(
  data: T | null,
  error: ApiError | null,
  status = 200,
  meta: Record<string, unknown> = {}
) {
  const requestId = randomUUID();
  const body: ApiEnvelope<T> = {
    data,
    error,
    meta: { requestId, ...meta }
  };

  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Request-Id": requestId
    }
  });
}

export async function parseJsonBody(request: Request): Promise<unknown> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > 200_000) {
    throw new Error("REQUEST_TOO_LARGE");
  }

  return request.json();
}

export function supabaseError(code: string, message: string, status: number) {
  return createApiResponse(null, { code, message }, status);
}

