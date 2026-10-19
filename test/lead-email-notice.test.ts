import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { LeadEmailNotice } from "../components/lead-capture-modal";

const NOTICE =
  "We save what you type here so we can send your results and follow up, even if you don't finish. See our privacy policy.";

test("the lead email field explains why the address is saved and links to privacy", () => {
  const html = renderToStaticMarkup(LeadEmailNotice());
  const text = html.replace(/<[^>]+>/g, "").replace(/&#x27;|&apos;/g, "'");
  assert.equal(text, NOTICE);
  assert.match(html, /href="\/privacy"/);
  assert.doesNotMatch(html, /consent|checkbox/i);

  const source = readFileSync(
    new URL("../components/lead-capture-modal.tsx", import.meta.url),
    "utf8",
  );
  const emailField = source.slice(
    source.indexOf("Email Address"),
    source.indexOf("Name (optional)"),
  );
  assert.match(emailField, /<LeadEmailNotice \/>/);
});
