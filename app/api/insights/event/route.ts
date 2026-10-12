import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { persistInsightEvent, parseInsightEvent } from "@/lib/insights-event";
import { guardPublicPost, readJsonBody } from "@/lib/request-guards";
import { ApiResponse } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!db.isConfigured()) {
    return new NextResponse(null, { status: 204 });
  }

  const blocked = guardPublicPost(request, "insights");
  if (blocked) return blocked;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  if (!body.value || typeof body.value !== "object") {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Invalid request body" },
      { status: 400 },
    );
  }

  const parsed = parseInsightEvent(body.value);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Invalid event" },
      { status: 400 },
    );
  }

  try {
    await persistInsightEvent(parsed.data);
  } catch (error) {
    console.error("Insights event persist failed", error);
  }

  return NextResponse.json<ApiResponse>({ success: true });
}

export function GET() {
  return NextResponse.json<ApiResponse>(
    { success: false, error: "Method not allowed" },
    { status: 405, headers: { Allow: "POST" } },
  );
}
