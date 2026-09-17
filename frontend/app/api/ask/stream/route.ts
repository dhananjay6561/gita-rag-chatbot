/**
 * POST /api/ask/stream - browser-facing proxy to the backend /ask/stream. It
 * validates the inbound body, opens the upstream SSE stream server-side, and
 * pipes it straight to the client so BACKEND_URL is never exposed. Upstream
 * failures before the stream opens are mapped to clean JSON error statuses.
 */
import {
  streamBackend,
  BackendError,
  BackendTimeoutError,
  BackendUnavailableError,
} from "@/lib/api";
import { AskRequestSchema } from "@/lib/contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(error: string, status: number): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function POST(request: Request) {
  let parsed;
  try {
    parsed = AskRequestSchema.parse(await request.json());
  } catch {
    return jsonError("invalid_request", 400);
  }

  try {
    const upstream = await streamBackend(parsed);
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive",
        "x-accel-buffering": "no", // disable proxy buffering so tokens flush live
      },
    });
  } catch (err) {
    if (err instanceof BackendTimeoutError) return jsonError("upstream_timeout", 504);
    if (err instanceof BackendUnavailableError) return jsonError("upstream_unavailable", 503);
    if (err instanceof BackendError) return jsonError("upstream_error", 502);
    return jsonError("internal_error", 500);
  }
}
