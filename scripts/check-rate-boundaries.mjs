import assert from "node:assert/strict"

import {
  calculateMultipleDwellingsPremium,
  calculateMultipleUnitsPremium,
  calculateQLeaveLevy,
  calculateQLDHomeWarrantyPremium,
  calculateQLDRenovationPremium,
} from "../lib/premium-calculator.ts"

const cases = [
  {
    name: "new home below threshold",
    expected: 0,
    actual: calculateQLDHomeWarrantyPremium(3299.99),
  },
  {
    name: "new home exact minimum band",
    expected: 194.25,
    actual: calculateQLDHomeWarrantyPremium(3300),
  },
  {
    name: "new home rounds above minimum band",
    expected: 197.5,
    actual: calculateQLDHomeWarrantyPremium(3300.01),
  },
  {
    name: "alterations below threshold",
    expected: 0,
    actual: calculateQLDRenovationPremium(3299.99),
  },
  {
    name: "alterations exact minimum band",
    expected: 209.85,
    actual: calculateQLDRenovationPremium(3300),
  },
  {
    name: "alterations rounds above minimum band",
    expected: 214.85,
    actual: calculateQLDRenovationPremium(3300.01),
  },
  {
    name: "multiple new-home dwellings use minimum band",
    expected: 388.5,
    actual: calculateMultipleDwellingsPremium(6000, 2),
  },
  {
    name: "multiple alterations units use minimum band",
    expected: 419.7,
    actual: calculateMultipleUnitsPremium(6000, 2),
  },
  {
    name: "QLeave below GST-inclusive threshold",
    expected: 0,
    actual: calculateQLeaveLevy(164999),
  },
  {
    name: "QLeave exact GST-inclusive threshold",
    expected: 862.5,
    actual: calculateQLeaveLevy(165000),
  },
  {
    name: "QLeave current rate checkpoint",
    expected: 1150,
    actual: calculateQLeaveLevy(220000),
  },
]

for (const check of cases) {
  assert.ok(
    Math.abs(check.actual - check.expected) < 1e-9,
    `${check.name}: expected ${check.expected}, received ${check.actual}`,
  )
}

console.log(
  JSON.stringify(
    {
      status: "pass",
      case_count: cases.length,
      cases,
    },
    null,
    2,
  ),
)
