import { db, type RetentionTable } from "@/lib/db";

/**
 * Retention taken from the privacy policy (app/privacy/page.tsx):
 * "We keep information only as long as we need it for quotes, follow-up,
 * site improvement, and legal or accounting records. We then delete or
 * de-identify it."
 *
 * That sentence does not give a number of days or months for any data type.
 * maxAgeMs stays null until the policy states a period. This job must not
 * invent one.
 */
export const RETENTION_BATCH_SIZE = 500;
export const RETENTION_MAX_BATCHES = 1000;

export interface RetentionRule {
  id:
    | "leads"
    | "calc_runs"
    | "insights_events"
    | "analytics"
    | "legal_or_accounting_records";
  purpose: string;
  store: RetentionTable | null;
  maxAgeMs: number | null;
  timestampColumn: "created_at" | null;
  unsupportedReason: string | null;
}

export const PRIVACY_RETENTION_RULES: readonly RetentionRule[] = [
  {
    id: "leads",
    purpose:
      "quotes and follow-up, including contact details from abandoned forms",
    store: "leads",
    maxAgeMs: null,
    timestampColumn: "created_at",
    unsupportedReason: null,
  },
  {
    id: "calc_runs",
    purpose:
      "site improvement from calculator inputs, estimates, and the session id stored with them",
    store: "calc_runs",
    maxAgeMs: null,
    timestampColumn: "created_at",
    unsupportedReason: null,
  },
  {
    id: "insights_events",
    purpose: "calculator and partial-lead events",
    store: null,
    maxAgeMs: null,
    timestampColumn: null,
    unsupportedReason:
      "Insight events are not stored in their own table. calculation_completed and estimate_updated are calc_runs rows, and lead_partial is a leads row.",
  },
  {
    id: "analytics",
    purpose: "usage and device information",
    store: null,
    maxAgeMs: null,
    timestampColumn: null,
    unsupportedReason:
      "Google Analytics, Google Tag Manager, PostHog, and Vercel Analytics hold this data outside our database.",
  },
  {
    id: "legal_or_accounting_records",
    purpose: "legal or accounting records",
    store: null,
    maxAgeMs: null,
    timestampColumn: null,
    unsupportedReason:
      "The database has no legal or accounting record table. Quote email copies held by Resend are not rows this job can delete.",
  },
];

export interface RetentionDeletePlan {
  id: RetentionRule["id"];
  store: RetentionTable;
  cutoff: Date;
  timestampColumn: "created_at";
}

export function retentionCutoff(now: Date, maxAgeMs: number): Date {
  return new Date(now.getTime() - maxAgeMs);
}

export function isPastRetention(storedAt: Date, cutoff: Date): boolean {
  return storedAt.getTime() < cutoff.getTime();
}

export function planRetentionDeletes(
  rules: readonly RetentionRule[],
  now: Date,
): RetentionDeletePlan[] {
  const plans: RetentionDeletePlan[] = [];
  for (const rule of rules) {
    if (
      rule.store === null ||
      rule.timestampColumn === null ||
      rule.maxAgeMs === null
    ) {
      continue;
    }
    plans.push({
      id: rule.id,
      store: rule.store,
      cutoff: retentionCutoff(now, rule.maxAgeMs),
      timestampColumn: rule.timestampColumn,
    });
  }
  return plans;
}

function skipReason(rule: RetentionRule): string | null {
  if (rule.store === null || rule.timestampColumn === null) {
    return (
      rule.unsupportedReason ??
      "This data is not stored in a table this job can delete."
    );
  }
  if (rule.maxAgeMs === null) {
    return "The privacy policy states no numeric retention period for this data.";
  }
  return null;
}

export interface RetentionPurgeResult {
  deleted: Record<RetentionTable, number>;
  applied: Array<{ id: RetentionRule["id"]; cutoff: string; deleted: number }>;
  skipped: Array<{ id: RetentionRule["id"]; reason: string }>;
}

async function defaultDeleteBatch(plan: RetentionDeletePlan, limit: number) {
  return db.deleteCreatedBefore(plan.store, plan.cutoff, limit);
}

export async function runRetentionPurge(options?: {
  now?: Date;
  rules?: readonly RetentionRule[];
  batchSize?: number;
  maxBatches?: number;
  deleteBatch?: (plan: RetentionDeletePlan, limit: number) => Promise<number>;
}): Promise<RetentionPurgeResult> {
  const now = options?.now ?? new Date();
  const rules = options?.rules ?? PRIVACY_RETENTION_RULES;
  const batchSize = options?.batchSize ?? RETENTION_BATCH_SIZE;
  const maxBatches = options?.maxBatches ?? RETENTION_MAX_BATCHES;
  const deleteBatch = options?.deleteBatch ?? defaultDeleteBatch;
  const deleted: Record<RetentionTable, number> = { leads: 0, calc_runs: 0 };
  const applied: RetentionPurgeResult["applied"] = [];
  const skipped: RetentionPurgeResult["skipped"] = [];

  for (const rule of rules) {
    const reason = skipReason(rule);
    if (reason || rule.store === null || rule.maxAgeMs === null) {
      skipped.push({
        id: rule.id,
        reason:
          reason ??
          "The privacy policy states no numeric retention period for this data.",
      });
      continue;
    }

    const plan: RetentionDeletePlan = {
      id: rule.id,
      store: rule.store,
      cutoff: retentionCutoff(now, rule.maxAgeMs),
      timestampColumn: "created_at",
    };
    let count = 0;
    for (let batch = 0; batch < maxBatches; batch += 1) {
      const removed = await deleteBatch(plan, batchSize);
      count += removed;
      if (removed < batchSize) break;
    }
    deleted[plan.store] += count;
    applied.push({
      id: plan.id,
      cutoff: plan.cutoff.toISOString(),
      deleted: count,
    });
  }

  return { deleted, applied, skipped };
}
