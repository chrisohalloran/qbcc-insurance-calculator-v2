import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildQuoteEmailHtml } from "../emails/quote-email";
import type { LeadCaptureData } from "../lib/types";

const lead: LeadCaptureData = {
  leadReference: "lead-1",
  reviewStatus: "pending_review",
  email: "builder@example.com",
  timestamp: "2026-10-19T00:00:00.000Z",
  source: "post-calculation",
  quoteData: {
    workType: "new-construction",
    insurableValue: 250000,
    units: 2,
    premium: 1234.5,
    qleave: 875,
    total: 2109.5,
  },
};

test("customer quote email contains the results and the sender identification", () => {
  const html = buildQuoteEmailHtml(lead);
  assert.match(html, /new-construction/);
  assert.match(html, /250,000\.00/);
  assert.match(html, /1,234\.50/);
  assert.match(html, /875\.00/);
  assert.match(html, /2,109\.50/);
  assert.match(html, /Units[\s\S]*?>2</);
  assert.match(html, /Striking Group/);
  assert.match(html, /chris@strikinggroup\.com\.au/);

  const route = readFileSync(new URL("../app/api/leads/route.ts", import.meta.url), "utf8");
  assert.match(route, /Your QBCC insurance estimate \[\$\{lead\.leadReference\}\]/);
});
