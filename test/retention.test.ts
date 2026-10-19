import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server";
import PrivacyPage from "../app/privacy/page";
import { db, retentionDeleteSql } from "../lib/db";
import {
  PRIVACY_RETENTION_RULES,
  RETENTION_BATCH_SIZE,
  calcRunsRemovedWithLeads,
  leadMatchesRule,
  ruleCutoff,
  sessionOnlyCalcRunExpired,
  runRetentionPurge,
  type RetentionCalcRunRow,
  type RetentionLeadRow,
  type RetentionRule,
} from "../lib/retention";

const now = new Date("2026-10-19T00:00:00.000Z");
const dayMs = 24 * 60 * 60 * 1000;

const RETENTION_SENTENCE =
  "If you start a quote form but don't send it, we delete those details after 90 days. We keep quote requests you send for up to 2 years after we last contact you, then delete them. Calculator runs linked to your details are deleted with them, and other calculator runs are deleted after 2 years.";

function rule(id: RetentionRule["id"]): RetentionRule {
  const found = PRIVACY_RETENTION_RULES.find((item) => item.id === id);
  if (!found) throw new Error(`missing rule ${id}`);
  return found;
}

function lead(
  overrides: Partial<RetentionLeadRow> & Pick<RetentionLeadRow, "id" | "status">,
): RetentionLeadRow {
  const createdAt = overrides.createdAt ?? now;
  return {
    sessionId: overrides.sessionId ?? overrides.id,
    createdAt,
    updatedAt: overrides.updatedAt ?? createdAt,
    ...overrides,
  };
}

function run(
  overrides: Partial<RetentionCalcRunRow> &
    Pick<RetentionCalcRunRow, "id" | "sessionId">,
): RetentionCalcRunRow {
  return { createdAt: overrides.createdAt ?? now, ...overrides };
}

test("the privacy policy states the 90-day and 2-year retention periods", () => {
  const html = renderToStaticMarkup(PrivacyPage()).replace(/&#x27;|&apos;/g, "'");
  assert.ok(html.includes(RETENTION_SENTENCE));
  assert.doesNotMatch(html, /We keep information only as long as we need it/);
});

test("partial leads expire 90 days after created_at", () => {
  const partial = rule("partial_leads");
  assert.equal(partial.status, "partial");
  assert.equal(partial.timestampColumn, "created_at");
  assert.equal(partial.maxAgeMs, 90 * dayMs);
  const cutoff = ruleCutoff(now, partial);
  assert.equal(cutoff.toISOString(), new Date(now.getTime() - 90 * dayMs).toISOString());

  const kept = lead({
    id: "fresh",
    status: "partial",
    createdAt: new Date(now.getTime() - 89 * dayMs),
    updatedAt: new Date(now.getTime() - 200 * dayMs),
  });
  const expired = lead({
    id: "old",
    status: "partial",
    createdAt: new Date(now.getTime() - 91 * dayMs),
    updatedAt: new Date(now.getTime() - dayMs),
  });
  const exactly = lead({
    id: "exact",
    status: "partial",
    createdAt: cutoff,
  });

  assert.equal(leadMatchesRule(kept, partial, now), false);
  assert.equal(leadMatchesRule(expired, partial, now), true);
  assert.equal(leadMatchesRule(exactly, partial, now), false);
  assert.equal(leadMatchesRule({ ...expired, status: "submitted" }, partial, now), false);
});

test("submitted leads expire 2 years after updated_at", () => {
  const submitted = rule("submitted_leads");
  assert.equal(submitted.status, "submitted");
  assert.equal(submitted.timestampColumn, "updated_at");
  assert.equal(submitted.years, 2);
  const cutoff = ruleCutoff(now, submitted);
  assert.equal(cutoff.toISOString(), "2024-10-19T00:00:00.000Z");

  const older = lead({
    id: "old-submitted",
    status: "submitted",
    createdAt: new Date("2020-01-01T00:00:00.000Z"),
    updatedAt: new Date(cutoff.getTime() - dayMs),
  });
  const newer = lead({
    id: "fresh-submitted",
    status: "submitted",
    createdAt: new Date("2020-01-01T00:00:00.000Z"),
    updatedAt: new Date(cutoff.getTime() + dayMs),
  });
  const exactly = lead({
    id: "exact-submitted",
    status: "submitted",
    updatedAt: cutoff,
  });

  assert.equal(leadMatchesRule(older, submitted, now), true);
  assert.equal(leadMatchesRule(newer, submitted, now), false);
  assert.equal(leadMatchesRule(exactly, submitted, now), false);
  assert.equal(leadMatchesRule({ ...older, status: "partial" }, submitted, now), false);
});

test("calc runs linked to a deleted lead go with it, and session-only runs expire after 2 years", () => {
  const partial = rule("partial_leads");
  const submitted = rule("submitted_leads");
  const runsRule = rule("session_only_calc_runs");
  assert.equal(runsRule.timestampColumn, "created_at");
  assert.equal(runsRule.years, 2);
  assert.equal(ruleCutoff(now, runsRule).toISOString(), "2024-10-19T00:00:00.000Z");

  const expiredPartial = lead({
    id: "partial-old",
    sessionId: "session-partial",
    status: "partial",
    createdAt: new Date(ruleCutoff(now, partial).getTime() - dayMs),
    updatedAt: now,
  });
  const keptPartial = lead({
    id: "partial-fresh",
    sessionId: "session-fresh",
    status: "partial",
    createdAt: new Date(ruleCutoff(now, partial).getTime() + dayMs),
  });
  const keptSubmitted = lead({
    id: "submitted-fresh",
    sessionId: "session-shared",
    status: "submitted",
    updatedAt: new Date(ruleCutoff(now, submitted).getTime() + dayMs),
  });
  const expiredSubmitted = lead({
    id: "submitted-old",
    sessionId: "session-submitted",
    status: "submitted",
    createdAt: now,
    updatedAt: new Date(ruleCutoff(now, submitted).getTime() - dayMs),
  });
  const sharedPartial = lead({
    id: "shared-partial",
    sessionId: "session-shared",
    status: "partial",
    createdAt: new Date(ruleCutoff(now, partial).getTime() - dayMs),
  });
  const leads = [
    expiredPartial,
    keptPartial,
    keptSubmitted,
    expiredSubmitted,
    sharedPartial,
  ];
  const deleted = leads.filter(
    (row) =>
      leadMatchesRule(row, partial, now) || leadMatchesRule(row, submitted, now),
  );
  const remaining = leads.filter((row) => !deleted.includes(row));
  const runs: RetentionCalcRunRow[] = [
    run({ id: "linked-partial", sessionId: "session-partial", createdAt: now }),
    run({
      id: "linked-fresh",
      sessionId: "session-fresh",
      createdAt: new Date("2020-01-01T00:00:00.000Z"),
    }),
    run({
      id: "linked-shared",
      sessionId: "session-shared",
      createdAt: new Date("2020-01-01T00:00:00.000Z"),
    }),
    run({ id: "linked-submitted", sessionId: "session-submitted", createdAt: now }),
    run({
      id: "orphan-old",
      sessionId: "session-orphan-old",
      createdAt: new Date(ruleCutoff(now, runsRule).getTime() - dayMs),
    }),
    run({
      id: "orphan-fresh",
      sessionId: "session-orphan-fresh",
      createdAt: new Date(ruleCutoff(now, runsRule).getTime() + dayMs),
    }),
    run({
      id: "orphan-exact",
      sessionId: "session-orphan-exact",
      createdAt: ruleCutoff(now, runsRule),
    }),
  ];

  assert.deepEqual(
    deleted.map((row) => row.id).sort(),
    ["partial-old", "shared-partial", "submitted-old"],
  );
  assert.deepEqual(
    calcRunsRemovedWithLeads(runs, deleted, remaining)
      .map((row) => row.id)
      .sort(),
    ["linked-partial", "linked-submitted"],
  );
  assert.deepEqual(
    runs
      .filter((row) => sessionOnlyCalcRunExpired(row, leads, now))
      .map((row) => row.id),
    ["orphan-old"],
  );
});

test("purge deletes in batches until a short batch and a second run deletes nothing", async () => {
  let partialLeft = 1200;
  const calls: string[] = [];
  const purge = async (item: RetentionRule, cutoff: Date, limit: number) => {
    calls.push(`${item.id}:${cutoff.toISOString()}:${limit}`);
    if (item.id !== "partial_leads") return { leads: 0, calcRuns: 0 };
    const leads = Math.min(limit, partialLeft);
    partialLeft -= leads;
    return { leads, calcRuns: leads };
  };

  const first = await runRetentionPurge({ now, purge });
  assert.equal(partialLeft, 0);
  assert.equal(first.deleted.leads, 1200);
  assert.equal(first.deleted.calc_runs, 1200);
  assert.deepEqual(
    calls.filter((call) => call.startsWith("partial_leads")),
    Array.from({ length: 3 }, () => {
      return `partial_leads:${ruleCutoff(now, rule("partial_leads")).toISOString()}:${RETENTION_BATCH_SIZE}`;
    }),
  );
  assert.equal(calls.filter((call) => call.startsWith("submitted_leads")).length, 1);
  assert.equal(
    calls.filter((call) => call.startsWith("session_only_calc_runs")).length,
    1,
  );

  calls.length = 0;
  const second = await runRetentionPurge({ now, purge });
  assert.equal(second.deleted.leads, 0);
  assert.equal(second.deleted.calc_runs, 0);
  assert.equal(calls.length, 3);
});

test("a non-shrinking delete batch stops at the batch cap", async () => {
  let calls = 0;
  const result = await runRetentionPurge({
    now,
    batchSize: 2,
    maxBatches: 3,
    purge: async (item) => {
      if (item.id !== "partial_leads") return { leads: 0, calcRuns: 0 };
      calls += 1;
      return { leads: 2, calcRuns: 0 };
    },
  });
  assert.equal(calls, 3);
  assert.equal(result.deleted.leads, 6);
});

test("the default purge asks the database for each policy cutoff", async (t) => {
  const calls: string[] = [];
  const original = db.purgeRetentionBatch;
  db.purgeRetentionBatch = async (item, cutoff, limit) => {
    calls.push(`${item.id}:${item.timestampColumn}:${cutoff.toISOString()}:${limit}`);
    return { leads: 0, calcRuns: 0 };
  };
  t.after(() => {
    db.purgeRetentionBatch = original;
  });

  const result = await runRetentionPurge({ now });
  assert.deepEqual(calls, [
    `partial_leads:created_at:${ruleCutoff(now, rule("partial_leads")).toISOString()}:${RETENTION_BATCH_SIZE}`,
    `submitted_leads:updated_at:${ruleCutoff(now, rule("submitted_leads")).toISOString()}:${RETENTION_BATCH_SIZE}`,
    `session_only_calc_runs:created_at:${ruleCutoff(now, rule("session_only_calc_runs")).toISOString()}:${RETENTION_BATCH_SIZE}`,
  ]);
  assert.deepEqual(result.deleted, { leads: 0, calc_runs: 0 });
  assert.ok(result.skipped.some((item) => item.id === "analytics"));
  assert.ok(result.skipped.some((item) => item.id === "legal_or_accounting_records"));
});

test("database purge SQL follows the retention rule columns", () => {
  const partialSql = retentionDeleteSql(rule("partial_leads"));
  const submittedSql = retentionDeleteSql(rule("submitted_leads"));
  const runsSql = retentionDeleteSql(rule("session_only_calc_runs"));

  assert.match(partialSql, /status = 'partial'/);
  assert.match(partialSql, /created_at < \$1/);
  assert.doesNotMatch(partialSql, /GREATEST|updated_at < \$1/);
  assert.match(submittedSql, /status = 'submitted'/);
  assert.match(submittedSql, /updated_at < \$1/);
  assert.match(partialSql, /DELETE FROM calc_runs/);
  assert.match(submittedSql, /DELETE FROM calc_runs/);
  assert.match(partialSql, /remaining\.id NOT IN \(SELECT id FROM doomed\)/);
  assert.match(runsSql, /created_at < \$1/);
  assert.match(
    runsSql,
    /NOT EXISTS \(\s*SELECT 1 FROM leads\s+WHERE leads\.session_id = calc_runs\.session_id\s*\)/,
  );
  assert.doesNotMatch(readFileSync(new URL("../lib/db.ts", import.meta.url), "utf8"), /deleteCreatedBefore/);
});

test("the leads created_at index is a new migration", () => {
  const init = readFileSync(new URL("../db/migrations/001_init.sql", import.meta.url), "utf8");
  const added = readFileSync(
    new URL("../db/migrations/002_leads_created_at_idx.sql", import.meta.url),
    "utf8",
  );
  const migrate = readFileSync(new URL("../scripts/migrate.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(init, /leads_created_at_idx/);
  assert.match(added, /CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads \(created_at\)/);
  assert.match(migrate, /readdirSync/);
  assert.doesNotMatch(migrate, /001_init\.sql/);
});

test("GET /api/cron/retention requires CRON_SECRET and reports the policy purge", async (t) => {
  const previous = process.env.CRON_SECRET;
  const original = db.purgeRetentionBatch;
  db.purgeRetentionBatch = async () => ({ leads: 0, calcRuns: 0 });
  t.after(() => {
    if (previous === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = previous;
    db.purgeRetentionBatch = original;
  });

  const { GET } = await import("../app/api/cron/retention/route");
  const call = (authorization?: string) =>
    GET(
      new NextRequest("https://www.qbccinsurancecalculator.com.au/api/cron/retention", {
        headers: authorization ? { authorization } : {},
      }),
    );

  delete process.env.CRON_SECRET;
  assert.equal((await call("Bearer anything")).status, 401);

  process.env.CRON_SECRET = "test-cron-secret";
  assert.equal((await call("Bearer nope")).status, 401);

  const accepted = await call("Bearer test-cron-secret");
  assert.equal(accepted.status, 200);
  const body = await accepted.json();
  assert.equal(body.success, true);
  assert.deepEqual(body.deleted, { leads: 0, calc_runs: 0 });
  assert.ok(body.applied.some((item: { id: string }) => item.id === "partial_leads"));
  assert.ok(body.applied.some((item: { id: string }) => item.id === "submitted_leads"));
  assert.ok(
    body.applied.some((item: { id: string }) => item.id === "session_only_calc_runs"),
  );
});
