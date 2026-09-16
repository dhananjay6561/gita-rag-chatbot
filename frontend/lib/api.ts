/**
 * Server-only client for the FastAPI backend. The browser never talks to the
 * backend directly: it calls our /api/* route handlers, which call these
 * functions. That keeps BACKEND_URL server-side and lets us validate every
 * upstream payload against the contract SSOT (lib/contract.ts) before it reaches
 * the UI, so a backend contract drift fails loudly here instead of rendering
 * garbage.
 */
import "server-only";

import {
  AskRequestSchema,
  AskResponseSchema,
  HealthSchema,
  type AskRequest,
  type AskResponse,
  type Health,
} from "@/lib/contract";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
// Slightly above the backend's own REQUEST_TIMEOUT_S (30s) so the backend's
// graceful timeout reply wins the race over a hard abort here.
const TIMEOUT_MS = Number(process.env.BACKEND_TIMEOUT_MS ?? 35_000);

/** Non-2xx from the backend. `status` is the upstream HTTP status. */
export class BackendError extends Error {
  constructor(readonly status: number) {
    super(`backend responded ${status}`);
    this.name = "BackendError";
  }
}

/** Thrown when the backend does not answer within TIMEOUT_MS. */
export class BackendTimeoutError extends Error {
  constructor() {
    super("backend request timed out");
    this.name = "BackendTimeoutError";
  }
}

async function backendFetch(path: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(`${BACKEND_URL}${path}`, {
      ...init,
      signal: controller.signal,
      cache: "no-store", // guidance is per-query; never cache a seeker's answer
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new BackendTimeoutError();
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** POST /ask. Validates the request against the contract before sending and the
 *  response after receiving. */
export async function askBackend(input: AskRequest): Promise<AskResponse> {
  const body = AskRequestSchema.parse(input);
  const res = await backendFetch("/ask", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new BackendError(res.status);
  return AskResponseSchema.parse(await res.json());
}

/** GET /health for readiness checks. */
export async function getHealth(): Promise<Health> {
  const res = await backendFetch("/health", { method: "GET" });
  if (!res.ok) throw new BackendError(res.status);
  return HealthSchema.parse(await res.json());
}
