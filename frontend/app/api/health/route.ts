/**
 * GET /api/health - surfaces backend readiness (index loaded, corpus size) to
 * uptime checks without exposing the backend URL. 200 when the backend is
 * ready, 503 otherwise.
 */
import { NextResponse } from "next/server";

import { getHealth } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const health = await getHealth();
    const ok = health.status === "ok" && health.index_loaded;
    return NextResponse.json(health, { status: ok ? 200 : 503 });
  } catch {
    return NextResponse.json({ status: "unavailable" }, { status: 503 });
  }
}
