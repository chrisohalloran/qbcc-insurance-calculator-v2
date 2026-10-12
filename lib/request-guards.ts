import { NextRequest, NextResponse } from "next/server";

export const MAX_PUBLIC_BODY_BYTES = 16384;

const requests = new Map<string, { count: number; until: number }>();

export function limited(key: string) {
  const now = Date.now();
  for (const [existingKey, value] of requests) {
    if (value.until < now) requests.delete(existingKey);
  }
  if (requests.size >= 10000 && !requests.has(key)) return true;
  const item = requests.get(key) ?? { count: 0, until: now + 60000 };
  item.count++;
  requests.set(key, item);
  return item.count > 10;
}

export function originDenied(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  return (
    origin !== `http://${request.headers.get("host")}` &&
    origin !== `https://${request.headers.get("host")}` &&
    origin !== request.nextUrl.origin &&
    origin !== "https://www.qbccinsurancecalculator.com.au"
  );
}

export function guardPublicPost(request: NextRequest): NextResponse | null {
  if (originDenied(request)) {
    return NextResponse.json(
      { success: false, error: "Invalid origin" },
      { status: 403 },
    );
  }

  if (
    limited(
      request.headers.get("x-vercel-forwarded-for") ||
        request.headers.get("x-forwarded-for") ||
        "local",
    )
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "Too many requests. Please try again in a minute.",
      },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  if (Number(request.headers.get("content-length") || 0) > MAX_PUBLIC_BODY_BYTES) {
    return NextResponse.json(
      { success: false, error: "Request too large" },
      { status: 413 },
    );
  }

  return null;
}

export async function readJsonBody(
  request: NextRequest,
): Promise<
  { ok: true; value: unknown } | { ok: false; response: NextResponse }
> {
  try {
    const raw = await request.text();
    if (raw.length > MAX_PUBLIC_BODY_BYTES) {
      return {
        ok: false,
        response: NextResponse.json(
          { success: false, error: "Request too large" },
          { status: 413 },
        ),
      };
    }
    return { ok: true, value: JSON.parse(raw) as unknown };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 },
      ),
    };
  }
}
