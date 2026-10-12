import test from "node:test";
import assert from "node:assert/strict";

test("getSessionId stores a random id in sessionStorage", async () => {
  const store = new Map<string, string>();
  const beacons: Array<{ url: string; body: string }> = [];
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    writable: true,
    value: {
      sessionStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
      },
      crypto: { randomUUID: () => "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" },
    },
  });
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    writable: true,
    value: {
      sendBeacon: (url: string, data: { _text?: string }) => {
        beacons.push({ url, body: data._text || "" });
        return true;
      },
    },
  });
  class FakeBlob {
    _text: string;
    type: string;
    constructor(parts: string[], options: { type: string }) {
      this._text = parts.join("");
      this.type = options.type;
    }
  }
  Object.defineProperty(globalThis, "Blob", {
    configurable: true,
    writable: true,
    value: FakeBlob,
  });

  const { getSessionId, sendInsightEvent } = await import(
    "../lib/insights-client"
  );
  assert.equal(getSessionId(), "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  assert.equal(getSessionId(), "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  sendInsightEvent({
    event: "calculation_completed",
    work_type: "renovation",
  });
  assert.equal(beacons.length, 1);
  assert.equal(beacons[0].url, "/api/insights/event");
  assert.match(beacons[0].body, /"session_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"/);
});
