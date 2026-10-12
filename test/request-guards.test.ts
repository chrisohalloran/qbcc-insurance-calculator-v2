import test from "node:test";
import assert from "node:assert/strict";
import {
  INSIGHT_RATE_LIMIT,
  LEAD_RATE_LIMIT,
  limited,
  resetPublicRateLimitsForTests,
} from "../lib/request-guards";

test("leads and insights rate limits use separate counters", () => {
  resetPublicRateLimitsForTests();
  const ip = "198.51.100.90";

  for (let index = 0; index < LEAD_RATE_LIMIT; index += 1) {
    assert.equal(limited(ip, "leads"), false);
  }
  assert.equal(limited(ip, "leads"), true);

  for (let index = 0; index < INSIGHT_RATE_LIMIT; index += 1) {
    assert.equal(limited(ip, "insights"), false);
  }
  assert.equal(limited(ip, "insights"), true);
});
