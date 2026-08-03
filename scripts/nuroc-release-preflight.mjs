import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

const files = {
  calculator: "components/calculator-form.tsx",
  leadModal: "components/lead-capture-modal.tsx",
  estimateLead: "components/estimate-lead-capture.tsx",
  leadsApi: "app/api/leads/route.ts",
  leadEmail: "emails/lead-notification.tsx",
  types: "lib/types.ts",
  offerCard: "components/contextual-offer-card.tsx",
}

const required = [
  {
    file: files.calculator,
    label: "safe email quote CTA",
    text: "Email my quote",
  },
  {
    file: files.calculator,
    label: "safe draft-prep CTA",
    text: "Get draft-prep help",
  },
  {
    file: files.calculator,
    label: "user review/payment boundary",
    text: "We prepare the portal draft, then you review it and pay QBCC directly.",
  },
  {
    file: files.calculator,
    label: "self-serve QBCC portal link",
    text: "Open QBCC portal",
  },
  {
    file: files.calculator,
    label: "self-serve QLeave link",
    text: "Open QLeave",
  },
  {
    file: files.offerCard,
    label: "contextual offer placement",
    text: "Recommended next step",
  },
  {
    file: files.leadModal,
    label: "lead-capture view event",
    text: 'posthog?.capture("lead_capture_viewed"',
  },
  {
    file: files.leadModal,
    label: "lead-capture dismiss event",
    text: 'posthog?.capture("lead_capture_dismissed"',
  },
  {
    file: files.leadModal,
    label: "submission event trigger property",
    text: "lead_capture_trigger: trigger",
  },
  {
    file: files.leadModal,
    label: "lead request trigger persistence",
    text: "leadCaptureTrigger: trigger",
  },
  {
    file: files.leadsApi,
    label: "API accepts auto modal trigger",
    text: '"auto_after_calculation"',
  },
  {
    file: files.leadsApi,
    label: "API accepts email button trigger",
    text: '"email_quote_button"',
  },
  {
    file: files.leadsApi,
    label: "API accepts contextual offer trigger",
    text: '"contextual_offer"',
  },
  {
    file: files.leadsApi,
    label: "API validates trigger before storage",
    text: "leadCaptureTrigger: isValidLeadCaptureTrigger(body.leadCaptureTrigger) ? body.leadCaptureTrigger : undefined",
  },
  {
    file: files.leadEmail,
    label: "operator email includes trigger",
    text: "Capture Trigger:",
  },
  {
    file: files.leadsApi,
    label: "server-generated opaque lead reference",
    text: "leadReference: randomUUID()",
  },
  {
    file: files.leadsApi,
    label: "default pending review state",
    text: 'reviewStatus: "pending_review"',
  },
  {
    file: files.leadsApi,
    label: "operator email reference subject",
    text: "New QBCC Calculator Lead [${lead.leadReference}]",
  },
  {
    file: files.leadsApi,
    label: "customer email reference subject",
    text: "Your QBCC insurance estimate [${lead.leadReference}]",
  },
  {
    file: files.leadModal,
    label: "analytics lead reference",
    text: "lead_reference: data.data.leadReference",
  },
  {
    file: files.leadModal,
    label: "analytics pending review state",
    text: "lead_review_status: data.data.reviewStatus",
  },
  {
    file: files.estimateLead,
    label: "estimate-page shared quote analytics",
    text: "buildQuoteAnalyticsProperties(quoteData)",
  },
  {
    file: files.estimateLead,
    label: "estimate-page capture view event",
    text: 'posthog?.capture("lead_capture_viewed"',
  },
  {
    file: files.estimateLead,
    label: "estimate-page quote click event",
    text: 'posthog?.capture("email_quote_clicked"',
  },
  {
    file: files.estimateLead,
    label: "estimate-page accepted submission event",
    text: 'posthog?.capture("email_quote_submitted"',
  },
  {
    file: files.estimateLead,
    label: "estimate-page trigger persistence",
    text: 'leadCaptureTrigger: "estimate_page"',
  },
  {
    file: files.estimateLead,
    label: "estimate-page receipt validation",
    text: 'data.data.reviewStatus !== "pending_review"',
  },
  {
    file: files.estimateLead,
    label: "estimate-page analytics lead reference",
    text: "lead_reference: data.data.leadReference",
  },
  {
    file: files.estimateLead,
    label: "estimate-page analytics review state",
    text: "lead_review_status: data.data.reviewStatus",
  },
  {
    file: files.leadEmail,
    label: "operator email includes lead reference",
    text: "Lead Reference:",
  },
  {
    file: files.leadEmail,
    label: "operator email includes review status",
    text: "Review Status:",
  },
  {
    file: files.types,
    label: "shared pending review status",
    text: "export type LeadReviewStatus = 'pending_review'",
  },
  {
    file: files.types,
    label: "shared trigger type includes auto modal",
    text: "'auto_after_calculation'",
  },
  {
    file: files.types,
    label: "shared trigger type includes email button",
    text: "'email_quote_button'",
  },
  {
    file: files.types,
    label: "shared trigger type includes contextual offer",
    text: "'contextual_offer'",
  },
]

const forbidden = [
  {
    file: files.calculator,
    label: "payment-style QBCC CTA",
    text: "Pay QBCC",
  },
  {
    file: files.calculator,
    label: "payment-style QLeave CTA",
    text: "Pay QLeave",
  },
  {
    file: files.calculator,
    label: "old lodge CTA",
    text: "Lodge My Insurance",
  },
  {
    file: files.calculator,
    label: "submit-on-behalf promise",
    text: "submit to QBCC on your behalf",
  },
  {
    file: files.calculator,
    label: "submit-on-behalf promise variant",
    text: "submit it to QBCC on your behalf",
  },
  {
    file: files.leadModal,
    label: "PII-based PostHog identification",
    text: "posthog?.identify",
  },
  {
    file: files.leadModal,
    label: "browser distinct ID capture",
    text: "get_distinct_id",
  },
  {
    file: files.leadModal,
    label: "browser distinct ID request field",
    text: "posthogDistinctId",
  },
  {
    file: files.estimateLead,
    label: "estimate-page PII-based PostHog identification",
    text: "posthog?.identify",
  },
  {
    file: files.estimateLead,
    label: "estimate-page browser distinct ID capture",
    text: "get_distinct_id",
  },
  {
    file: files.estimateLead,
    label: "estimate-page browser distinct ID request field",
    text: "posthogDistinctId",
  },
  {
    file: files.leadsApi,
    label: "browser distinct ID persistence",
    text: "posthogDistinctId",
  },
  {
    file: files.types,
    label: "browser distinct ID contract",
    text: "posthogDistinctId",
  },
]

const eventNames = [
  "calculation_completed",
  "email_quote_clicked",
  "email_quote_submitted",
  "lead_capture_viewed",
  "lead_capture_dismissed",
  "draft_prep_help_clicked",
  "contextual_offer_clicked",
  "open_qbcc_portal_clicked",
  "open_qleave_clicked",
]

async function readProjectFile(relativePath) {
  return readFile(path.join(root, relativePath), "utf8")
}

function includesLiteral(source, text) {
  return source.includes(text)
}

const cache = new Map()

async function get(relativePath) {
  if (!cache.has(relativePath)) {
    cache.set(relativePath, await readProjectFile(relativePath))
  }

  return cache.get(relativePath)
}

const failures = []
let checks = 0

for (const check of required) {
  checks += 1
  const source = await get(check.file)
  if (!includesLiteral(source, check.text)) {
    failures.push(`${check.file}: missing ${check.label} (${check.text})`)
  }
}

for (const check of forbidden) {
  checks += 1
  const source = await get(check.file)
  if (includesLiteral(source, check.text)) {
    failures.push(`${check.file}: forbidden ${check.label} still present (${check.text})`)
  }
}

const combinedSources = [
  await get(files.calculator),
  await get(files.leadModal),
  await get(files.estimateLead),
  await get(files.leadsApi),
].join("\n")

for (const eventName of eventNames) {
  checks += 1
  if (!includesLiteral(combinedSources, eventName)) {
    failures.push(`instrumentation: missing PostHog event ${eventName}`)
  }
}

const apiSource = await get(files.leadsApi)
const typeSource = await get(files.types)
const triggerValues = ["auto_after_calculation", "email_quote_button", "contextual_offer", "estimate_page"]

for (const trigger of triggerValues) {
  checks += 1
  if (!includesLiteral(apiSource, `"${trigger}"`) || !includesLiteral(typeSource, `'${trigger}'`)) {
    failures.push(`lead capture trigger ${trigger} is not shared by API and type contract`)
  }
}

if (failures.length > 0) {
  console.error("[FAIL] Nuroc release preflight failed")
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exitCode = 1
} else {
  console.log(`[OK] Nuroc release preflight passed (${checks} checks)`)
}
