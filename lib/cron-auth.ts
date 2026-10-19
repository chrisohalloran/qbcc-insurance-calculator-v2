import { timingSafeEqual } from "node:crypto";

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
