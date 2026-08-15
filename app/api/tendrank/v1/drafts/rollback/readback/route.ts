import { NextResponse } from "next/server"
import { readbackReceiverDraft } from "@/lib/tendrank-receiver"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const rawBody = await request.text()
  const result = readbackReceiverDraft(request.headers, rawBody)
  return NextResponse.json(result.body, { status: result.status })
}

export function GET() {
  return NextResponse.json({ error: "method_not_allowed" }, { status: 405 })
}
