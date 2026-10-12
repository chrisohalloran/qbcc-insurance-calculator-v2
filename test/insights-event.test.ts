import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { db } from "../lib/db";
import { parseInsightEvent } from "../lib/insights-event";

const validCalc = {
  event: "calculation_completed",
  session_id: "11111111-1111-4111-8111-111111111111",
  work_type: "new-construction",
  insurable_value: 165000,
  num_units: 1,
  premium: 1809.1,
  qleave: 862.5,
  total: 2671.6,
  rate_version: "qbcc-2020-07-01-qleave-2026-09-13",
};

function request(
  url: string,
  init: ConstructorParameters<typeof NextRequest>[1] = {},
) {
  return new NextRequest(url, init);
}

test("insight event schema accepts calc runs and partial leads", () => {
  assert.equal(parseInsightEvent(validCalc).success, true);
  assert.equal(
    parseInsightEvent({
      event: "lead_partial",
      session_id: validCalc.session_id,
      email: "builder@example.com",
      name: "Sam",
    }).success,
    true,
  );
  assert.equal(parseInsightEvent({ event: "unknown" }).success, false);
  assert.equal(
    parseInsightEvent({
      ...validCalc,
      event: "lead_partial",
      email: "not-an-email",
    }).success,
    false,
  );
});

test("POST /api/insights/event validates, persists, and rejects bad requests", async (t) => {
  const originalInsert = db.insertCalcRun;
  const originalUpsert = db.upsertLead;
  const originalConfigured = db.isConfigured;
  const inserted: unknown[] = [];
  const upserts: unknown[] = [];

  db.isConfigured = () => true;
  db.insertCalcRun = async (record) => {
    inserted.push(record);
    return true;
  };
  db.upsertLead = async (record) => {
    upserts.push(record);
    return true;
  };
  t.after(() => {
    db.insertCalcRun = originalInsert;
    db.upsertLead = originalUpsert;
    db.isConfigured = originalConfigured;
  });

  const { POST, GET } = await import("../app/api/insights/event/route");

  const getResponse = await GET();
  assert.equal(getResponse.status, 405);

  const invalid = await POST(
    request("https://www.qbccinsurancecalculator.com.au/api/insights/event", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "203.0.113.10",
      },
      body: JSON.stringify({ event: "not-real" }),
    }),
  );
  assert.equal(invalid.status, 400);

  const forbidden = await POST(
    request("https://www.qbccinsurancecalculator.com.au/api/insights/event", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://evil.example",
        "x-forwarded-for": "203.0.113.11",
      },
      body: JSON.stringify(validCalc),
    }),
  );
  assert.equal(forbidden.status, 403);

  const tooLarge = await POST(
    request("https://www.qbccinsurancecalculator.com.au/api/insights/event", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "content-length": "20000",
        "x-forwarded-for": "203.0.113.12",
      },
      body: JSON.stringify(validCalc),
    }),
  );
  assert.equal(tooLarge.status, 413);

  const accepted = await POST(
    request("https://www.qbccinsurancecalculator.com.au/api/insights/event", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://www.qbccinsurancecalculator.com.au",
        "x-forwarded-for": "203.0.113.13",
      },
      body: JSON.stringify(validCalc),
    }),
  );
  assert.equal(accepted.status, 200);
  assert.equal((await accepted.json()).success, true);
  assert.equal(inserted.length, 1);

  const partial = await POST(
    request("https://www.qbccinsurancecalculator.com.au/api/insights/event", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "203.0.113.14",
      },
      body: JSON.stringify({
        event: "lead_partial",
        session_id: validCalc.session_id,
        email: "Builder@Example.com",
        name: "Sam",
        source: "post-calculation",
        consent: true,
        work_type: "renovation",
        insurable_value: 80000,
        num_units: 1,
        premium: 500,
        total: 500,
      }),
    }),
  );
  assert.equal(partial.status, 200);
  assert.equal(upserts.length, 1);
  assert.deepEqual(upserts[0], {
    sessionId: validCalc.session_id,
    email: "builder@example.com",
    name: "Sam",
    phone: undefined,
    workType: "renovation",
    insurableValue: 80000,
    numUnits: 1,
    premium: 500,
    total: 500,
    status: "partial",
    consent: false,
    source: "post-calculation",
  });
});
