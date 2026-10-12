"use client";
import { track } from "@vercel/analytics";
import type { PostHog } from "posthog-js";

export type ContractValueBand =
  | "<20k"
  | "20-100k"
  | "100-300k"
  | "300k-1m"
  | "1m+";

export function getContractValueBand(value: number): ContractValueBand {
  if (value < 20_000) return "<20k";
  if (value < 100_000) return "20-100k";
  if (value < 300_000) return "100-300k";
  if (value < 1_000_000) return "300k-1m";
  return "1m+";
}

export function sanitizeEventProperties(properties: object = {}) {
  return Object.fromEntries(
    Object.entries(properties).filter(
      ([key, value]) =>
        !/^(email|phone|name|.*distinct.?id)$/i.test(key) &&
        (typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean"),
    ),
  ) as Record<string, string | number | boolean>;
}

function pushNamedEvent(
  name: string,
  properties: Record<string, string | number | boolean>,
) {
  if (typeof window === "undefined") return;
  const target = window as Window & { dataLayer?: object[] };
  (target.dataLayer ??= []).push({ event: name, ...properties });
}

// Keep contact details out of this event interface.
export function captureEvent(
  client: PostHog | undefined,
  name: string,
  properties: object = {},
) {
  const safe = sanitizeEventProperties(properties);
  client?.capture(name, safe);
  if (typeof window !== "undefined") {
    // Always push a named Custom Event so GTM triggers fire, even when gtag exists.
    pushNamedEvent(name, safe);
    if (window.gtag) window.gtag("event", name, safe);
  }
  track(name, safe);
}

export function captureQuoteAndCtaClick(
  client: PostHog | undefined,
  ctaId: string,
  ctaLocation: string,
) {
  const properties = { cta_id: ctaId, cta_location: ctaLocation };
  captureEvent(client, "cta_click", properties);
  captureEvent(client, "quote_click", properties);
}

export function captureReferralOrAffiliateClick(
  client: PostHog | undefined,
  ctaId: string,
  ctaLocation: string,
) {
  captureEvent(client, "cta_click", { cta_id: ctaId, cta_location: ctaLocation });
}

export function captureGenerateLead(
  client: PostHog | undefined,
  formId: string,
  contractValue: number,
) {
  captureEvent(client, "generate_lead", {
    form_id: formId,
    value_band: getContractValueBand(contractValue),
  });
}
