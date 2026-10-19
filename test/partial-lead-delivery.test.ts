import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  PartialLeadDeliveryError,
  assertDeliverableLead,
} from "../lib/lead-delivery";
import { persistInsightEvent } from "../lib/insights-event";
import { db } from "../lib/db";

test("partial leads are refused by every outbound delivery path", () => {
  assert.throws(
    () => assertDeliverableLead({ status: "partial" }),
    PartialLeadDeliveryError,
  );
  assert.doesNotThrow(() => assertDeliverableLead({ status: "submitted" }));
  assert.doesNotThrow(() => assertDeliverableLead({}));

  const route = readFileSync(new URL("../app/api/leads/route.ts", import.meta.url), "utf8");
  for (const fn of [
    "async function sendLeadWebhook",
    "async function sendLeadEmails",
    "async function appendLead",
    "async function sendNotificationEmail",
  ]) {
    const start = route.indexOf(fn);
    assert.ok(start >= 0, fn);
    const body = route.slice(start, route.indexOf("\nasync function ", start + fn.length));
    assert.match(body, /assertDeliverableLead\(/);
  }
});

test("a partial lead event is stored and never emailed or exported", async (t) => {
  const originalUpsert = db.upsertLead;
  const originalConfigured = db.isConfigured;
  const calls: string[] = [];
  db.isConfigured = () => true;
  db.upsertLead = async (record) => {
    calls.push(record.status);
    return true;
  };
  const originalFetch = globalThis.fetch;
  let fetches = 0;
  globalThis.fetch = (async () => {
    fetches += 1;
    throw new Error("partial lead delivery attempted");
  }) as typeof fetch;
  t.after(() => {
    db.upsertLead = originalUpsert;
    db.isConfigured = originalConfigured;
    globalThis.fetch = originalFetch;
  });

  const stored = await persistInsightEvent({
    event: "lead_partial",
    session_id: "session-partial-1",
    email: "builder@example.com",
    name: "Sam",
    source: "post-calculation",
    work_type: "renovation",
    insurable_value: 80000,
    num_units: 1,
    premium: 500,
    total: 500,
  });

  assert.equal(stored, true);
  assert.deepEqual(calls, ["partial"]);
  assert.equal(fetches, 0);

  const insights = readFileSync(
    new URL("../lib/insights-event.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(insights, /resend|webhook|sequence|instantly/i);
});
