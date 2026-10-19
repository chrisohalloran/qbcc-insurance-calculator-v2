import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { NextRequest } from "next/server";
import { db } from "../lib/db";
import {
  PRIVACY_RETENTION_RULES,
  RETENTION_BATCH_SIZE,
  isPastRetention,
  planRetentionDeletes,
  retentionCutoff,
  runRetentionPurge,
  type RetentionRule,
} from "../lib/retention";

const now = new Date("2026-10-19T00:00:00.000Z");

test("the privacy policy states no numeric retention period", () => {
  const source = readFileSync(new URL("../app/privacy/page.tsx", import.meta.url), "utf8");
  const match = source.match(
    /We keep information only as long as we need it[\s\S]*?We then delete or de-identify it\./,
  );
  assert.ok(match, "retention sentence missing from /privacy");
  assert.doesNotMatch(match[0], /\d+\s+(day|days|month|months|year|years)/i);
});

test("retention cutoff drops rows strictly older than the boundary", () => {
  const maxAgeMs = 90 * 24 * 60 * 60 * 1000;
  const cutoff = retentionCutoff(now, maxAgeMs);
  assert.equal(cutoff.toISOString(), new Date(now.getTime() - maxAgeMs).toISOString());
  assert.equal(isPastRetention(new Date(cutoff.getTime() - 1), cutoff), true);
  assert.equal(isPastRetention(cutoff, cutoff), false);
  assert.equal(isPastRetention(new Date(cutoff.getTime() + 1), cutoff), false);
});

test("published privacy rules do not invent a numeric retention period", async () => {
  for (const rule of PRIVACY_RETENTION_RULES) {
    assert.equal(rule.maxAgeMs, null, rule.id);
  }
  assert.deepEqual(planRetentionDeletes(PRIVACY_RETENTION_RULES, now), []);

  const result = await runRetentionPurge({ now });
  assert.deepEqual(result.deleted, { leads: 0, calc_runs: 0 });
  assert.deepEqual(result.applied, []);
  assert.ok(
    result.skipped.some(
      (item) => item.id === "leads" && /no numeric retention period/i.test(item.reason),
    ),
  );
  assert.ok(
    result.skipped.some(
      (item) => item.id === "calc_runs" && /no numeric retention period/i.test(item.reason),
    ),
  );
  assert.ok(
    result.skipped.some(
      (item) =>
        item.id === "insights_events" &&
        /calc_runs/.test(item.reason) &&
        /leads/.test(item.reason),
    ),
  );
  assert.ok(
    result.skipped.some(
      (item) => item.id === "analytics" && /Google Analytics/.test(item.reason),
    ),
  );
  assert.ok(
    result.skipped.some(
      (item) =>
        item.id === "legal_or_accounting_records" && /no legal or accounting/i.test(item.reason),
    ),
  );
});

test("purge deletes in batches until a short batch and a second run deletes nothing", async () => {
  const rule: RetentionRule = {
    id: "leads",
    purpose: "cutoff fixture",
    store: "leads",
    maxAgeMs: 1000,
    timestampColumn: "created_at",
    unsupportedReason: null,
  };
  let remaining = 1200;
  const calls: Array<{ cutoff: string; limit: number }> = [];
  const first = await runRetentionPurge({
    now,
    rules: [rule],
    deleteBatch: async (plan, limit) => {
      calls.push({ cutoff: plan.cutoff.toISOString(), limit });
      const count = Math.min(limit, remaining);
      remaining -= count;
      return count;
    },
  });

  assert.equal(calls.length, 3);
  assert.deepEqual(
    calls.map((call) => call.limit),
    [RETENTION_BATCH_SIZE, RETENTION_BATCH_SIZE, RETENTION_BATCH_SIZE],
  );
  assert.equal(calls[0].cutoff, retentionCutoff(now, 1000).toISOString());
  assert.equal(remaining, 0);
  assert.equal(first.deleted.leads, 1200);
  assert.equal(first.deleted.calc_runs, 0);
  assert.equal(first.applied[0]?.deleted, 1200);

  const second = await runRetentionPurge({
    now,
    rules: [rule],
    deleteBatch: async () => 0,
  });
  assert.equal(second.deleted.leads, 0);
  assert.deepEqual(second.applied, [
    { id: "leads", cutoff: retentionCutoff(now, 1000).toISOString(), deleted: 0 },
  ]);
});

test("a non-shrinking delete batch stops at the batch cap", async () => {
  const rule: RetentionRule = {
    id: "calc_runs",
    purpose: "cutoff fixture",
    store: "calc_runs",
    maxAgeMs: 50,
    timestampColumn: "created_at",
    unsupportedReason: null,
  };
  let calls = 0;
  const result = await runRetentionPurge({
    now,
    rules: [rule],
    maxBatches: 3,
    batchSize: 2,
    deleteBatch: async () => {
      calls += 1;
      return 2;
    },
  });
  assert.equal(calls, 3);
  assert.equal(result.deleted.calc_runs, 6);
});

test("the default purge asks the database to delete rows older than the cutoff", async (t) => {
  const original = db.deleteCreatedBefore;
  const calls: Array<{ table: string; cutoff: string; limit: number }> = [];
  db.deleteCreatedBefore = async (table, cutoff, limit) => {
    calls.push({ table, cutoff: cutoff.toISOString(), limit });
    return 0;
  };
  t.after(() => {
    db.deleteCreatedBefore = original;
  });

  const rule: RetentionRule = {
    id: "calc_runs",
    purpose: "cutoff fixture",
    store: "calc_runs",
    maxAgeMs: 5000,
    timestampColumn: "created_at",
    unsupportedReason: null,
  };
  await runRetentionPurge({ now, rules: [rule] });
  assert.deepEqual(calls, [
    {
      table: "calc_runs",
      cutoff: retentionCutoff(now, 5000).toISOString(),
      limit: RETENTION_BATCH_SIZE,
    },
  ]);
});

test("GET /api/cron/retention requires CRON_SECRET and reports the policy purge", async (t) => {
  const previous = process.env.CRON_SECRET;
  t.after(() => {
    if (previous === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = previous;
  });

  const { GET } = await import("../app/api/cron/retention/route");
  const call = (authorization?: string) =>
    GET(
      new NextRequest("https://www.qbccinsurancecalculator.com.au/api/cron/retention", {
        headers: authorization ? { authorization } : {},
      }),
    );

  delete process.env.CRON_SECRET;
  const missing = await call("Bearer anything");
  assert.equal(missing.status, 401);

  process.env.CRON_SECRET = "test-cron-secret";
  const wrong = await call("Bearer nope");
  assert.equal(wrong.status, 401);

  const accepted = await call("Bearer test-cron-secret");
  assert.equal(accepted.status, 200);
  const body = await accepted.json();
  assert.equal(body.success, true);
  assert.deepEqual(body.deleted, { leads: 0, calc_runs: 0 });
  assert.deepEqual(body.applied, []);
});
