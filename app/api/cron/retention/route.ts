import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { runRetentionPurge } from "@/lib/retention";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function cronAuthorized(
  authorization: string | null,
  secret: string | undefined,
) {
  const configured = secret?.trim() ?? "";
  if (!configured) return false;
  const expected = Buffer.from(`Bearer ${configured}`);
  const actual = Buffer.from(authorization ?? "");
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

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
