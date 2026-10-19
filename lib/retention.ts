import { db, type RetentionPurgeRule } from "@/lib/db";

/**
 * Privacy policy retention (app/privacy/page.tsx):
 * partial leads are deleted 90 days after created_at, submitted leads
 * 2 years after updated_at (there is no separate last-contact column),
 * and session-only calc_runs 2 years after created_at. Calc runs that
 * share a session with a deleted lead are deleted in the same statement
 * unless another lead still uses that session.
 * Analytics and legal or accounting records are not in this database.
 */
const DAY_MS = 24 * 60 * 60 * 1000;

export const RETENTION_BATCH_SIZE = 500;
export const RETENTION_MAX_BATCHES = 1000;

export interface RetentionRule extends RetentionPurgeRule {
  maxAgeMs?: number;
  years?: number;
  countsAs: "leads" | "calc_runs";
}

export const PRIVACY_RETENTION_RULES: readonly RetentionRule[] = [
  {
    id: "partial_leads",
    status: "partial",
    timestampColumn: "created_at",
    maxAgeMs: 90 * DAY_MS,
    countsAs: "leads",
  },
  {
    id: "submitted_leads",
    status: "submitted",
    timestampColumn: "updated_at",
    years: 2,
    countsAs: "leads",
  },
  {
    id: "session_only_calc_runs",
    status: null,
    timestampColumn: "created_at",
    years: 2,
    countsAs: "calc_runs",
  },
];

const SKIPPED: Array<{ id: string; reason: string }> = [
  {
    id: "analytics",
    reason:
      "Google Analytics, Google Tag Manager, PostHog, and Vercel Analytics hold this data outside our database.",
  },
  {
    id: "legal_or_accounting_records",
    reason:
      "The database has no legal or accounting record table. Quote email copies held by Resend are not rows this job can delete.",
  },
];

export function ruleCutoff(
  now: Date,
  rule: Pick<RetentionRule, "maxAgeMs" | "years">,
): Date {
  if (rule.years != null) {
    const cutoff = new Date(now.getTime());
    cutoff.setUTCFullYear(cutoff.getUTCFullYear() - rule.years);
    return cutoff;
  }
  return new Date(now.getTime() - (rule.maxAgeMs ?? 0));
}

export interface RetentionLeadRow {
  id: string;
  sessionId: string;
  status: "partial" | "submitted";
  createdAt: Date;
  updatedAt: Date;
}

export interface RetentionCalcRunRow {
  id: string;
  sessionId: string;
  createdAt: Date;
}

export function leadMatchesRule(
  lead: RetentionLeadRow,
  item: RetentionRule,
  now: Date,
): boolean {
  if (item.status == null || lead.status !== item.status) return false;
  const storedAt =
    item.timestampColumn === "created_at" ? lead.createdAt : lead.updatedAt;
  return storedAt.getTime() < ruleCutoff(now, item).getTime();
}

export function calcRunsRemovedWithLeads(
  runs: readonly RetentionCalcRunRow[],
  deletedLeads: readonly Pick<RetentionLeadRow, "sessionId">[],
  remainingLeads: readonly Pick<RetentionLeadRow, "sessionId">[],
): RetentionCalcRunRow[] {
  const deletedSessions = new Set(deletedLeads.map((item) => item.sessionId));
  const remainingSessions = new Set(remainingLeads.map((item) => item.sessionId));
  return runs.filter(
    (item) =>
      deletedSessions.has(item.sessionId) && !remainingSessions.has(item.sessionId),
  );
}

export function sessionOnlyCalcRunExpired(
  run: RetentionCalcRunRow,
  leads: readonly Pick<RetentionLeadRow, "sessionId">[],
  now: Date,
): boolean {
  if (leads.some((item) => item.sessionId === run.sessionId)) return false;
  const runsRule = PRIVACY_RETENTION_RULES.find(
    (item) => item.id === "session_only_calc_runs",
  );
  if (!runsRule) return false;
  return run.createdAt.getTime() < ruleCutoff(now, runsRule).getTime();
}

export interface RetentionPurgeResult {
  deleted: { leads: number; calc_runs: number };
  applied: Array<{ id: RetentionRule["id"]; cutoff: string; deleted: number }>;
  skipped: Array<{ id: string; reason: string }>;
}

export async function runRetentionPurge(options?: {
  now?: Date;
  rules?: readonly RetentionRule[];
  batchSize?: number;
  maxBatches?: number;
  purge?: (
    rule: RetentionRule,
    cutoff: Date,
    limit: number,
  ) => Promise<{ leads: number; calcRuns: number }>;
}): Promise<RetentionPurgeResult> {
  const now = options?.now ?? new Date();
  const rules = options?.rules ?? PRIVACY_RETENTION_RULES;
  const batchSize = options?.batchSize ?? RETENTION_BATCH_SIZE;
  const maxBatches = options?.maxBatches ?? RETENTION_MAX_BATCHES;
  const purge =
    options?.purge ??
    ((rule, cutoff, limit) => db.purgeRetentionBatch(rule, cutoff, limit));
  const deleted = { leads: 0, calc_runs: 0 };
  const applied: RetentionPurgeResult["applied"] = [];

  for (const item of rules) {
    const cutoff = ruleCutoff(now, item);
    let leads = 0;
    let calcRuns = 0;
    for (let batch = 0; batch < maxBatches; batch += 1) {
      const removed = await purge(item, cutoff, batchSize);
      leads += removed.leads;
      calcRuns += removed.calcRuns;
      const primary = item.countsAs === "leads" ? removed.leads : removed.calcRuns;
      if (primary < batchSize) break;
    }
    deleted.leads += leads;
    deleted.calc_runs += calcRuns;
    applied.push({
      id: item.id,
      cutoff: cutoff.toISOString(),
      deleted: item.countsAs === "leads" ? leads : calcRuns,
    });
  }

  return { deleted, applied, skipped: SKIPPED };
}
