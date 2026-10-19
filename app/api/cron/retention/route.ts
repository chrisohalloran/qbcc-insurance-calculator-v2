import { NextRequest, NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { runRetentionPurge } from "@/lib/retention";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!cronAuthorized(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const result = await runRetentionPurge();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Retention purge failed", error);
    return NextResponse.json(
      { success: false, error: "Retention purge failed" },
      { status: 500 },
    );
  }
}
