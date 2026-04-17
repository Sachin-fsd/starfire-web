import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, message: "Digest cron placeholder. Implement push delivery in Phase 5." });
}
