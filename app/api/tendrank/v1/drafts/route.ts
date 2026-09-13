import { NextResponse } from "next/server"
import { createReceiverDraft } from "@/lib/tendrank-receiver"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const rawBody = await request.text()
  const result = createReceiverDraft(request.headers, rawBody)
  return NextResponse.json(result.body, { status: result.status })
}

export function GET() {
  return NextResponse.json({ error: "method_not_allowed" }, { status: 405 })
}
