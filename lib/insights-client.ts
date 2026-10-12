"use client";

const SESSION_STORAGE_KEY = "qbcc_session_id";
const INSIGHTS_EVENT_URL = "/api/insights/event";

declare global {
  interface Window {
    __qbccInsights?: boolean;
  }
}

export function insightsStorageEnabled() {
  return typeof window !== "undefined" && window.__qbccInsights === true;
}

export function getSessionId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing && existing.length >= 8 && existing.length <= 128) {
      return existing;
    }

    const created = window.crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, created);
    return created;
  } catch {
    return window.crypto?.randomUUID?.() || `session-${Date.now()}`;
  }
}

export function sendInsightEvent(payload: Record<string, unknown>) {
  if (!insightsStorageEnabled()) {
    return;
  }

  const body = JSON.stringify({
    ...payload,
    session_id: getSessionId(),
  });

  try {
    const blob = new Blob([body], { type: "application/json" });
    if (
      typeof navigator.sendBeacon === "function" &&
      navigator.sendBeacon(INSIGHTS_EVENT_URL, blob)
    ) {
      return;
    }
  } catch {
    // Fall through to fetch.
  }

  void fetch(INSIGHTS_EVENT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

export function quoteInsightFields(quote: {
  workType: string;
  insurableValue: number;
  units: number;
  premium: number;
  qleave: number;
  total?: number;
  rateVersion?: string;
}) {
  return {
    work_type: quote.workType,
    insurable_value: quote.insurableValue,
    num_units: quote.units,
    premium: quote.premium,
    qleave: quote.qleave,
    total: quote.total ?? quote.premium + quote.qleave,
    rate_version: quote.rateVersion,
  };
}
