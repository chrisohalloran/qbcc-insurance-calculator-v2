import test from "node:test";
import assert from "node:assert/strict";
import { registerCalculatorTools } from "../lib/webmcp";
test("WebMCP registers scoped tools, updates visible result and cleans up", async () => {
  const tools: any[] = [];
  let result: any;
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      modelContext: {
        registerTool: (tool: any, options: any) =>
          tools.push({ ...tool, signal: options.signal }),
      },
    },
  });
  const cleanup = registerCalculatorTools((q) => {
    result = q;
  });
  assert.deepEqual(
    tools.map((t) => t.name),
    ["calculate_estimate", "get_rate_methodology"],
  );
  const output = JSON.parse(
    await tools[0].execute({
      workType: "renovation",
      insurableValue: 165000,
      units: 1,
    }),
  );
  assert.equal(output.qleave, 862.5);
  assert.equal(result.revision, output.revision);
  assert.equal(tools[0].annotations.consequentialHint, false);
  await assert.rejects(
    tools[0].execute({ workType: "renovation", insurableValue: -1, units: 1 }),
  );
  assert.equal(
    JSON.parse(await tools[1].execute({})).qleaveThresholdExGst,
    150000,
  );
  cleanup();
  assert.ok(tools.every((t) => t.signal.aborted));
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {},
  });
  assert.equal(typeof registerCalculatorTools(() => {}), "function");
});
