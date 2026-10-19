import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import PrivacyPage from "../app/privacy/page";

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
});
