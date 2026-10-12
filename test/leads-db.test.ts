import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { db } from "../lib/db";

function leadRequest(email: string, key: string, forwardedFor: string) {
  return new NextRequest(
    "https://www.qbccinsurancecalculator.com.au/api/leads",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": key,
        "x-forwarded-for": forwardedFor,
      },
      body: JSON.stringify({
        source: "post-calculation",
        email,
        workType: "new-construction",
        insurableValue: 165000,
        units: 1,
        sessionId: "22222222-2222-4222-8222-222222222222",
      }),
    },
  );
}

test("leads succeed when the database is configured without Resend", async (t) => {
  process.env.VERCEL = "1";
  process.env.LEADS_STORAGE_MODE = "";
  process.env.LEADS_WEBHOOK_URL = "";
  process.env.RESEND_API_KEY = "";
  process.env.LEAD_NOTIFICATION_EMAIL = "";

  const originalConfigured = db.isConfigured;
  const originalUpsert = db.upsertLead;
  const upserts: unknown[] = [];
  db.isConfigured = () => true;
  db.upsertLead = async (record) => {
    upserts.push(record);
    return true;
  };
  t.after(() => {
    db.isConfigured = originalConfigured;
    db.upsertLead = originalUpsert;
  });

  const { POST } = await import("../app/api/leads/route");
  const response = await POST(
    leadRequest(
      "db-only@example.com",
      "controlled-db-only-test-01",
      "198.51.100.10",
    ),
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.data.deliveryStatus, "saved");
  assert.equal(upserts.length, 1);
  assert.equal((upserts[0] as { status: string }).status, "submitted");
  assert.equal((upserts[0] as { email: string }).email, "db-only@example.com");
  assert.equal((upserts[0] as { consent: boolean }).consent, false);
});

test("lead database failure does not block a successful email path", async (t) => {
  process.env.VERCEL = "1";
  process.env.LEADS_STORAGE_MODE = "";
  process.env.LEADS_WEBHOOK_URL = "";
  process.env.RESEND_API_KEY = "test-only-never-sent";
  process.env.LEAD_NOTIFICATION_EMAIL = "operator@example.com";

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("{}", { status: 200 });
  const originalConfigured = db.isConfigured;
  const originalUpsert = db.upsertLead;
  db.isConfigured = () => true;
  db.upsertLead = async () => {
    throw new Error("db down");
  };
  t.after(() => {
    globalThis.fetch = originalFetch;
    db.isConfigured = originalConfigured;
    db.upsertLead = originalUpsert;
  });

  const { POST } = await import("../app/api/leads/route");
  const response = await POST(
    leadRequest(
      "email-ok@example.com",
      "controlled-db-fail-email-ok-01",
      "198.51.100.11",
    ),
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.ok(["sent", "saved"].includes(body.data.deliveryStatus));
});

test("configured database failure still succeeds without Resend", async (t) => {
  process.env.VERCEL = "1";
  process.env.LEADS_STORAGE_MODE = "";
  process.env.LEADS_WEBHOOK_URL = "";
  process.env.RESEND_API_KEY = "";
  process.env.LEAD_NOTIFICATION_EMAIL = "";

  const originalConfigured = db.isConfigured;
  const originalUpsert = db.upsertLead;
  db.isConfigured = () => true;
  db.upsertLead = async () => {
    throw new Error("db down");
  };
  t.after(() => {
    db.isConfigured = originalConfigured;
    db.upsertLead = originalUpsert;
  });

  const { POST } = await import("../app/api/leads/route");
  const response = await POST(
    leadRequest(
      "db-fail@example.com",
      "controlled-db-fail-no-email-01",
      "198.51.100.12",
    ),
  );
  assert.equal(response.status, 200);
  assert.equal((await response.json()).success, true);
});
