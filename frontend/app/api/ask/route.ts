/**
 * POST /api/ask - browser-facing proxy to the backend /ask. Validates the
 * inbound body against the contract SSOT, forwards it server-side, and maps
 * upstream failures to clean statuses. No secret or backend URL is exposed to
 * the client.
 */
import { NextResponse } from "next/server";

import { AskRequestSchema } from "@/lib/contract";
import { askBackend, BackendError, BackendTimeoutError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // never statically cached; per-query

export async function POST(request: Request) {
  let parsed;
  try {
    parsed = AskRequestSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  try {
    const data = await askBackend(parsed);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof BackendTimeoutError) {
      return NextResponse.json({ error: "upstream_timeout" }, { status: 504 });
    }
    if (err instanceof BackendError) {
      return NextResponse.json({ error: "upstream_error" }, { status: 502 });
    }
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
