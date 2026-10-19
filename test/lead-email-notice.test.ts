import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { LeadEmailNotice } from "../components/lead-capture-modal";

test("the lead email field notices how the address is used and links to privacy", () => {
  const html = renderToStaticMarkup(LeadEmailNotice());
  assert.match(html, /We(?:'|&#x27;)ll use your email to send your results\./);
  assert.match(html, /href="\/privacy"/);
  assert.match(html, /privacy policy/);
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
