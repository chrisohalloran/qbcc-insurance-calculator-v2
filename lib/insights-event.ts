import { z } from "zod";
import { db } from "@/lib/db";
import { isValidEmail, normalizeEmail } from "@/lib/validation";

const optionalText = (max: number) =>
  z.preprocess((value) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }, z.string().max(max).optional());

const optionalNumber = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") return undefined;
  return value;
}, z.number().finite().min(0).optional());

export const calcRunEventSchema = z.object({
  event: z.enum(["calculation_completed", "estimate_updated"]),
  session_id: z.string().min(8).max(128),
  work_type: z.enum(["new-construction", "renovation"]),
  insurable_value: z.number().finite().min(0).max(1_000_000_000),
  num_units: z.number().int().min(1).max(1000),
  premium: z.number().finite().min(0),
  qleave: z.number().finite().min(0),
  total: z.number().finite().min(0),
  rate_version: optionalText(120),
});

export const leadPartialEventSchema = z
  .object({
    event: z.literal("lead_partial"),
    session_id: z.string().min(8).max(128),
    email: z.string().max(254),
    name: optionalText(200),
    phone: optionalText(40),
    work_type: optionalText(64),
    insurable_value: optionalNumber,
    num_units: z.preprocess((value) => {
      if (value === null || value === undefined || value === "") return undefined;
      return value;
    }, z.number().int().min(1).max(1000).optional()),
    premium: optionalNumber,
    total: optionalNumber,
    source: optionalText(64),
    consent: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (!isValidEmail(value.email)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["email"],
        message: "Valid email is required",
      });
    }
  });

export const insightEventSchema = z.discriminatedUnion("event", [
  calcRunEventSchema,
  leadPartialEventSchema,
]);

export type InsightEvent = z.infer<typeof insightEventSchema>;

export function parseInsightEvent(raw: unknown) {
  return insightEventSchema.safeParse(raw);
}

export async function persistInsightEvent(event: InsightEvent): Promise<boolean> {
  if (!db.isConfigured()) {
    return false;
  }

  try {
    if (event.event === "lead_partial") {
      return await db.upsertLead({
        sessionId: event.session_id,
        email: normalizeEmail(event.email),
        name: event.name,
        phone: event.phone,
        workType: event.work_type,
        insurableValue: event.insurable_value,
        numUnits: event.num_units,
        premium: event.premium,
        total: event.total,
        status: "partial",
        consent: event.consent === true,
        source: event.source,
      });
    }

    return await db.insertCalcRun({
      sessionId: event.session_id,
      workType: event.work_type,
      insurableValue: event.insurable_value,
      numUnits: event.num_units,
      premium: event.premium,
      qleave: event.qleave,
      total: event.total,
      rateVersion: event.rate_version,
    });
  } catch (error) {
    console.error("Insights event persist failed", {
      event: event.event,
      error,
    });
    return false;
  }
}
