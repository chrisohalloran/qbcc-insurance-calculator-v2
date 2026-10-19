import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import PrivacyPage from "../app/privacy/page";

test("privacy policy names the overseas email and database processors", () => {
  const html = renderToStaticMarkup(PrivacyPage());
  assert.match(html, /Resend processes quote emails in the United States/);
  assert.match(
    html,
    /Calculator runs and contact details are stored by Neon, the database provider for Vercel Postgres/,
  );
  assert.doesNotMatch(html, /TODO/);
});
