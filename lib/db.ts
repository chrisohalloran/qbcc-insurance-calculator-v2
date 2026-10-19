import { neon } from "@neondatabase/serverless";

export type LeadStatus = "submitted" | "partial";

export interface CalcRunRecord {
  sessionId: string;
  workType: string;
  insurableValue: number;
  numUnits: number;
  premium: number;
  qleave: number;
  total: number;
  rateVersion?: string;
}

export interface LeadRecord {
  sessionId: string;
  email: string;
  name?: string;
  phone?: string;
  workType?: string;
  insurableValue?: number;
  numUnits?: number;
  premium?: number;
  total?: number;
  status: LeadStatus;
  source?: string;
}

export function getDatabaseUrl(): string {
  return (
    process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim() || ""
  );
}

function getSql() {
  const databaseUrl = getDatabaseUrl();
  return databaseUrl ? neon(databaseUrl) : null;
}

export const SQL_RETENTION_FLOOR_MS = 30 * 24 * 60 * 60 * 1000;
const SQL_CUTOFF_BACKSTOP = "$1 < now() - interval '30 days'";

export function sqlBackstopDeletes(storedAt: Date, cutoff: Date, now: Date): boolean {
  if (![storedAt, cutoff, now].every((value) => Number.isFinite(value.getTime()))) {
    return false;
  }
  if (!(cutoff.getTime() < now.getTime() - SQL_RETENTION_FLOOR_MS)) return false;
  return storedAt.getTime() < cutoff.getTime();
}

const TIMESTAMP_COLUMNS = {
  created_at: "created_at",
  updated_at: "updated_at",
} as const;

const LEAD_STATUSES = {
  partial: "partial",
  submitted: "submitted",
} as const;

export interface RetentionPurgeRule {
  id: "partial_leads" | "submitted_leads" | "session_only_calc_runs";
  status: "partial" | "submitted" | null;
  timestampColumn: keyof typeof TIMESTAMP_COLUMNS;
}

export function retentionDeleteSql(rule: RetentionPurgeRule): string {
  const column = TIMESTAMP_COLUMNS[rule.timestampColumn];
  if (rule.id === "session_only_calc_runs") {
    return `WITH doomed AS (
      SELECT calc_runs.id
      FROM calc_runs
      WHERE calc_runs.${column} < $1
        AND ${SQL_CUTOFF_BACKSTOP}
        AND NOT EXISTS (
          SELECT 1 FROM leads
          WHERE leads.session_id = calc_runs.session_id
        )
      ORDER BY calc_runs.${column}, calc_runs.id
      LIMIT $2
    )
    DELETE FROM calc_runs
    WHERE id IN (SELECT id FROM doomed)
      AND ${SQL_CUTOFF_BACKSTOP}
    RETURNING id`;
  }

  const status = rule.status ? LEAD_STATUSES[rule.status] : null;
  if (!status) {
    throw new Error(`Retention rule ${rule.id} is missing a lead status`);
  }

  return `WITH doomed AS (
      SELECT id, session_id
      FROM leads
      WHERE status = '${status}'
        AND ${column} < $1
        AND ${SQL_CUTOFF_BACKSTOP}
      ORDER BY ${column}, id
      LIMIT $2
    ),
    removed_runs AS (
      DELETE FROM calc_runs
      WHERE session_id IN (SELECT session_id FROM doomed)
        AND NOT EXISTS (
          SELECT 1
          FROM leads AS remaining
          WHERE remaining.session_id = calc_runs.session_id
            AND remaining.id NOT IN (SELECT id FROM doomed)
        )
        AND ${SQL_CUTOFF_BACKSTOP}
      RETURNING id
    ),
    removed_leads AS (
      DELETE FROM leads
      WHERE id IN (SELECT id FROM doomed)
        AND ${SQL_CUTOFF_BACKSTOP}
      RETURNING id
    )
    SELECT
      (SELECT count(*)::int FROM removed_leads) AS leads_deleted,
      (SELECT count(*)::int FROM removed_runs) AS runs_deleted`;
}

async function purgeRetentionBatch(
  rule: RetentionPurgeRule,
  cutoff: Date,
  limit: number,
): Promise<{ leads: number; calcRuns: number }> {
  const sql = getSql();
  const size = Math.floor(limit);
  if (
    !sql ||
    Number.isNaN(cutoff.getTime()) ||
    size < 1 ||
    !sqlBackstopDeletes(new Date(0), cutoff, new Date())
  ) {
    return { leads: 0, calcRuns: 0 };
  }
  const batch = Math.min(size, 1000);
  const query = retentionDeleteSql(rule);
  if (rule.id === "session_only_calc_runs") {
    const rows = await sql.query(query, [cutoff, batch]);
    return { leads: 0, calcRuns: rows.length };
  }
  const rows = (await sql.query(query, [cutoff, batch])) as Array<{
    leads_deleted?: number;
    runs_deleted?: number;
  }>;
  const row = rows[0];
  return {
    leads: Number(row?.leads_deleted ?? 0),
    calcRuns: Number(row?.runs_deleted ?? 0),
  };
}

async function insertCalcRun(record: CalcRunRecord): Promise<boolean> {
  const sql = getSql();
  if (!sql) {
    return false;
  }

  await sql`
    INSERT INTO calc_runs (
      session_id,
      work_type,
      insurable_value,
      num_units,
      premium,
      qleave,
      total,
      rate_version
    ) VALUES (
      ${record.sessionId},
      ${record.workType},
      ${record.insurableValue},
      ${record.numUnits},
      ${record.premium},
      ${record.qleave},
      ${record.total},
      ${record.rateVersion ?? null}
    )
  `;
  return true;
}

async function upsertLead(record: LeadRecord): Promise<boolean> {
  const sql = getSql();
  if (!sql) {
    return false;
  }

  await sql`
    INSERT INTO leads (
      session_id,
      email,
      name,
      phone,
      work_type,
      insurable_value,
      num_units,
      premium,
      total,
      status,
      source
    ) VALUES (
      ${record.sessionId},
      ${record.email},
      ${record.name ?? null},
      ${record.phone ?? null},
      ${record.workType ?? null},
      ${record.insurableValue ?? null},
      ${record.numUnits ?? null},
      ${record.premium ?? null},
      ${record.total ?? null},
      ${record.status},
      ${record.source ?? null}
    )
    ON CONFLICT (session_id, email)
    DO UPDATE SET
      name = COALESCE(EXCLUDED.name, leads.name),
      phone = COALESCE(EXCLUDED.phone, leads.phone),
      work_type = COALESCE(EXCLUDED.work_type, leads.work_type),
      insurable_value = COALESCE(EXCLUDED.insurable_value, leads.insurable_value),
      num_units = COALESCE(EXCLUDED.num_units, leads.num_units),
      premium = COALESCE(EXCLUDED.premium, leads.premium),
      total = COALESCE(EXCLUDED.total, leads.total),
      status = CASE
        WHEN leads.status = 'submitted' OR EXCLUDED.status = 'submitted'
          THEN 'submitted'
        ELSE EXCLUDED.status
      END,
      source = COALESCE(EXCLUDED.source, leads.source),
      updated_at = now()
  `;
  return true;
}

export const db = {
  isConfigured() {
    return Boolean(getDatabaseUrl());
  },
  insertCalcRun,
  upsertLead,
  purgeRetentionBatch,
};
