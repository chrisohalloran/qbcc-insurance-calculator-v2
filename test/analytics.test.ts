import test from "node:test";
import assert from "node:assert/strict";
import {
  captureEvent,
  captureGenerateLead,
  captureQuoteAndCtaClick,
  captureReferralOrAffiliateClick,
  getContractValueBand,
  sanitizeEventProperties,
} from "../lib/analytics";

type DataLayerItem = Record<string, unknown>;

function installWindow() {
  const gtagCalls: unknown[][] = [];
  const dataLayer: DataLayerItem[] = [];
  const gtag = (...args: unknown[]) => {
    gtagCalls.push(args);
  };
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    writable: true,
    value: { dataLayer, gtag },
  });
  return { dataLayer, gtagCalls };
}

test("contract value bands never expose the raw contract value", () => {
  assert.equal(getContractValueBand(0), "<20k");
  assert.equal(getContractValueBand(19_999.99), "<20k");
  assert.equal(getContractValueBand(20_000), "20-100k");
  assert.equal(getContractValueBand(99_999), "20-100k");
  assert.equal(getContractValueBand(100_000), "100-300k");
  assert.equal(getContractValueBand(299_999), "100-300k");
  assert.equal(getContractValueBand(300_000), "300k-1m");
  assert.equal(getContractValueBand(999_999), "300k-1m");
  assert.equal(getContractValueBand(1_000_000), "1m+");
});

test("sanitizeEventProperties drops PII and non-scalar values", () => {
  assert.deepEqual(
    sanitizeEventProperties({
      email: "person@example.com",
      phone: "0400000000",
      name: "Jane",
      distinct_id: "abc",
      posthogDistinctId: "xyz",
      form_id: "email_quote",
      value_band: "100-300k",
      nested: { skip: true },
    }),
    { form_id: "email_quote", value_band: "100-300k" },
  );
});

test("captureEvent always writes dataLayer even when gtag exists", () => {
  const { dataLayer, gtagCalls } = installWindow();
  captureEvent(undefined, "calculator_started", { ignored: { object: true } });
  captureEvent(undefined, "calculator_completed", {
    premium_value: 1809.1,
    currency: "AUD",
    contract_value_band: "300k-1m",
    email: "hidden@example.com",
  });

  assert.deepEqual(dataLayer, [
    { event: "calculator_started" },
    {
      event: "calculator_completed",
      premium_value: 1809.1,
      currency: "AUD",
      contract_value_band: "300k-1m",
    },
  ]);
  assert.deepEqual(gtagCalls, [
    ["event", "calculator_started", {}],
    [
      "event",
      "calculator_completed",
      {
        premium_value: 1809.1,
        currency: "AUD",
        contract_value_band: "300k-1m",
      },
    ],
  ]);
});

test("quote, referral and lead helpers use the conversion contract", () => {
  const { dataLayer } = installWindow();
  captureQuoteAndCtaClick(undefined, "email_quote", "calculator_result");
  captureReferralOrAffiliateClick(
    undefined,
    "trade_solar_new_build",
    "contextual_offer",
  );
  captureGenerateLead(undefined, "email_quote", 450000);

  assert.deepEqual(
    dataLayer.map((item) => item.event),
    ["cta_click", "quote_click", "cta_click", "generate_lead"],
  );
  assert.deepEqual(dataLayer[0], {
    event: "cta_click",
    cta_id: "email_quote",
    cta_location: "calculator_result",
  });
  assert.deepEqual(dataLayer[3], {
    event: "generate_lead",
    form_id: "email_quote",
    value_band: "300k-1m",
  });
  assert.equal(
    Object.keys(dataLayer[3]).sort().join(","),
    "event,form_id,value_band",
  );
});
