import test from "node:test";
import assert from "node:assert/strict";
import { calculateQuote, quotePath, quoteSummary } from "../lib/quote";
import { calculateQLeaveLevy } from "../lib/premium-calculator";
import { escapeHtml } from "../emails/escape-html";
const base = {
  workType: "new-construction" as const,
  units: 1,
  insurableValue: 450000,
};
test("official table anchors and QLeave GST threshold", () => {
  assert.equal(
    calculateQuote({ ...base, insurableValue: 3300 }).premium,
    194.25,
  );
  assert.equal(
    calculateQuote({ ...base, insurableValue: 50000 }).premium,
    411.5,
  );
  assert.equal(
    calculateQuote({ ...base, insurableValue: 164999.99 }).qleave,
    0,
  );
  assert.equal(
    calculateQuote({ ...base, insurableValue: 165000 }).qleave,
    862.5,
  );
  assert.equal(calculateQLeaveLevy(165000), 862.5);
  assert.equal(
    calculateQuote({ ...base, insurableValue: 165000.01 }).qleave,
    862.5,
  );
  assert.equal(
    calculateQuote({ ...base, qleaveCostExGst: 149999.99 }).qleave,
    0,
  );
  assert.equal(
    calculateQuote({ ...base, qleaveCostExGst: 150000 }).qleave,
    862.5,
  );
});
test("share and edit retain multiple dwellings and independent QLeave basis", () => {
  const q = calculateQuote({ ...base, units: 2, qleaveCostExGst: 200000 });
  assert.equal(q.qleave, 1150);
  assert.equal(
    quotePath(q),
    "/estimate/new-construction/450000?units=2&qleave=200000",
  );
  assert.equal(
    quotePath(q, true),
    "/?type=new-construction&value=450000&units=2&qleave=200000",
  );
  assert.match(quoteSummary(q), /2 dwellings/);
  assert.equal(
    Math.round(q.total * 100),
    Math.round(q.premium * 100) + Math.round(q.qleave * 100),
  );
});
test("invalid and unbounded agent or API values fail closed", () => {
  for (const patch of [
    { units: 0 },
    { units: 1.5 },
    { units: 1001 },
    { insurableValue: NaN },
    { insurableValue: Infinity },
    { insurableValue: -1 },
    { insurableValue: 1e10 },
    { qleaveCostExGst: -1 },
    { workType: "other" },
  ])
    assert.throws(() => calculateQuote({ ...base, ...patch } as typeof base));
});
test("email content escapes user-controlled markup", () =>
  assert.equal(
    escapeHtml('<img src=x onerror="x">&'),
    "&lt;img src=x onerror=&quot;x&quot;&gt;&amp;",
  ));

test('normalized cents produce shareable URLs for high-precision inputs',()=>{
 const q=calculateQuote({...base,insurableValue:450000.001,qleaveCostExGst:200000.001});
 assert.equal(quotePath(q),'/estimate/new-construction/450000?qleave=200000');
});
