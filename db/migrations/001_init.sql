-- Calculator usage and lead storage for Vercel Postgres / Neon.

CREATE TABLE IF NOT EXISTS calc_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  work_type text NOT NULL,
  insurable_value numeric NOT NULL,
  num_units integer NOT NULL,
  premium numeric NOT NULL,
  qleave numeric NOT NULL,
  total numeric NOT NULL,
  rate_version text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS calc_runs_session_id_idx ON calc_runs (session_id);
CREATE INDEX IF NOT EXISTS calc_runs_created_at_idx ON calc_runs (created_at DESC);

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  email text NOT NULL,
  name text,
  phone text,
  work_type text,
  insurable_value numeric,
  num_units integer,
  premium numeric,
  total numeric,
  status text NOT NULL CHECK (status IN ('submitted', 'partial')),
  consent boolean NOT NULL DEFAULT false,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, email)
);

CREATE INDEX IF NOT EXISTS leads_email_idx ON leads (email);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads (status);
CREATE INDEX IF NOT EXISTS leads_updated_at_idx ON leads (updated_at DESC);
