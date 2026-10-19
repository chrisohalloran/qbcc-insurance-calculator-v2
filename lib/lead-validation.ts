import { z } from "zod";
import {
  isValidEmail,
  normalizeEmail,
  SESSION_ID_MAX_LENGTH,
  SESSION_ID_MIN_LENGTH,
} from "@/lib/validation";

export const LEAD_EMAIL_MAX_LENGTH = 254;
export const LEAD_NAME_MAX_LENGTH = 200;
export const LEAD_PHONE_MAX_LENGTH = 40;
const CONTACT_TOO_LONG = "Contact details are too long";

export function optionalTrimmedText(max: number, message?: string) {
  const text = message ? z.string().max(max, message) : z.string().max(max);
  return z.preprocess((value) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }, text.optional());
}

export function sessionIdSchema(required: true): z.ZodString;
export function sessionIdSchema(required: false): z.ZodType<string | undefined>;
export function sessionIdSchema(required: boolean) {
  if (required) {
    return z.string().min(SESSION_ID_MIN_LENGTH).max(SESSION_ID_MAX_LENGTH);
  }
  return z.preprocess((value) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }, z.string().max(SESSION_ID_MAX_LENGTH, "Session id is too long").optional());
}

export function leadEmailError(email: string): "Valid email is required" | null {
  if (!email || email.length > LEAD_EMAIL_MAX_LENGTH || !isValidEmail(email)) {
    return "Valid email is required";
  }
  return null;
}

export function parseLeadEmail(
  value: unknown,
):
  | { ok: true; email: string }
  | { ok: false; error: "Valid email is required" } {
  const email = typeof value === "string" ? normalizeEmail(value) : "";
  const error = leadEmailError(email);
  if (error) return { ok: false, error };
  return { ok: true, email };
}

const leadContactSchema = z.object({
  sessionId: sessionIdSchema(false),
  name: optionalTrimmedText(LEAD_NAME_MAX_LENGTH, CONTACT_TOO_LONG),
  phone: optionalTrimmedText(LEAD_PHONE_MAX_LENGTH, CONTACT_TOO_LONG),
});

export function parseLeadContact(input: {
  name: unknown;
  phone: unknown;
  sessionId: unknown;
}):
  | { ok: true; name?: string; phone?: string; sessionId?: string }
  | { ok: false; error: string } {
  const parsed = leadContactSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message || "Invalid request",
    };
  }
  return { ok: true, ...parsed.data };
}
