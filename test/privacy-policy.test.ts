import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import PrivacyPage, { metadata } from "../app/privacy/page";

test("privacy policy names the overseas email and database processors", () => {
  const html = renderToStaticMarkup(PrivacyPage());
  assert.match(html, /Resend processes quote emails in the United States/);
  assert.match(
    html,
    /Neon may store this data outside Australia, including in the United States/,
  );
  assert.match(
    html,
    /Analytics data is processed by Google \(Analytics and Tag Manager\), PostHog, and Vercel/,
  );
  assert.doesNotMatch(html, /connected webhook/);
  assert.doesNotMatch(html, /TODO/);
  assert.match(html, /operated by Leva Solutions/);
  assert.match(html, /The registered legal entity is Leva Solutions Pty Ltd/);
  assert.match(html, /chris@levasolutions\.com\.au/);
  assert.doesNotMatch(html, /Striking/i);
  assert.doesNotMatch(html, /strikinggroup/i);
  assert.doesNotMatch(html, /\bABN\b|\bACN\b|\b\d{2}\s?\d{3}\s?\d{3}\s?\d{3}\b/);
  assert.match(String(metadata.description), /Leva Solutions/);
  assert.doesNotMatch(String(metadata.description), /Striking|strikinggroup/i);
});
