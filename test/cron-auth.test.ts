import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cronAuthorized } from "../lib/cron-auth";

test("the retention route does not export cronAuthorized", () => {
  const source = readFileSync(
    new URL("../app/api/cron/retention/route.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /export\s+(async\s+)?function\s+cronAuthorized\b/);
  assert.match(source, /import\s*\{[^}]*\bcronAuthorized\b[^}]*\}\s*from\s*["']@\/lib\/cron-auth["']/);
});

test("cronAuthorized fails closed unless the bearer secret matches", () => {
  assert.equal(cronAuthorized("Bearer secret", undefined), false);
  assert.equal(cronAuthorized("Bearer secret", ""), false);
  assert.equal(cronAuthorized("Bearer secret", "   "), false);
  assert.equal(cronAuthorized(null, "secret"), false);
  assert.equal(cronAuthorized("Bearer nope", "secret"), false);
  assert.equal(cronAuthorized("Bearer secret", "secret"), true);
  assert.equal(cronAuthorized("Bearer secret", " secret"), true);
});
