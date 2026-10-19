-- Partial-lead retention deletes by created_at.

CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at);
