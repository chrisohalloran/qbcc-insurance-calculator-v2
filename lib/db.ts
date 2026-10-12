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
  consent: boolean;
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
      consent,
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
      ${record.consent},
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
      consent = leads.consent OR EXCLUDED.consent,
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
};
