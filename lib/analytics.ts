"use client";
import { track } from "@vercel/analytics";
import type { PostHog } from "posthog-js";
// Keep contact details out of this event interface.
export function captureEvent(
  client: PostHog | undefined,
  name: string,
  properties: object = {},
) {
  const safe = Object.fromEntries(
    Object.entries(properties).filter(
      ([key, value]) =>
        !/^(email|phone|name|.*distinct.?id)$/i.test(key) &&
        (typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean"),
    ),
  ) as Record<string, string | number | boolean>;
  client?.capture(name, safe);
  if (typeof window !== "undefined") {
    if (window.gtag) window.gtag("event", name, safe);
    else if (process.env.NEXT_PUBLIC_GTM_ID) {
      const target = window as Window & { dataLayer?: object[] };
      (target.dataLayer ??= []).push({event:name,...safe});
    }
  }
  track(name, safe);
}
