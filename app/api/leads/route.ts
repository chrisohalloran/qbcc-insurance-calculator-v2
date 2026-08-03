import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import fs from "fs/promises"
import path from "path"
import { buildLeadNotificationHtml } from "@/emails/lead-notification"
import { buildQuoteEmailHtml } from "@/emails/quote-email"
import { ApiResponse, LeadCaptureData, LeadCaptureRequest, LeadCaptureTrigger } from "@/lib/types"
import { MAX_UNITS, isValidEmail, normalizeEmail } from "@/lib/validation"

export const runtime = "nodejs"

const DEFAULT_DATA_DIR = path.join(process.cwd(), "data")
const LOCAL_DATA_DIR = process.env.LEADS_DATA_DIR?.trim()
const DATA_DIR = process.env.LEADS_STORAGE_MODE === "local" && LOCAL_DATA_DIR
  ? path.resolve(LOCAL_DATA_DIR)
  : DEFAULT_DATA_DIR
const LEADS_FILE = path.join(DATA_DIR, "leads.json")
const NOTIFICATIONS_FILE = path.join(DATA_DIR, "notifications.json")
const LEADS_WEBHOOK_URL = process.env.LEADS_WEBHOOK_URL?.trim()
const LEADS_WEBHOOK_SECRET = process.env.LEADS_WEBHOOK_SECRET?.trim()
const RESEND_API_KEY = process.env.RESEND_API_KEY?.trim()
const LEAD_NOTIFICATION_EMAIL = process.env.LEAD_NOTIFICATION_EMAIL?.trim() || process.env.NOTIFICATION_EMAIL?.trim()
const LEAD_EMAIL_FROM = process.env.LEAD_EMAIL_FROM?.trim() || "QBCC Calculator <quotes@mail.levasolutions.com.au>"
const LEAD_EMAIL_REPLY_TO = process.env.LEAD_EMAIL_REPLY_TO?.trim() || LEAD_NOTIFICATION_EMAIL
const USE_LOCAL_LEAD_STORAGE = process.env.LEADS_STORAGE_MODE === "local" || process.env.NODE_ENV !== "production"
const ALLOWED_SOURCES: LeadCaptureRequest["source"][] = [
  "post-calculation",
  "pre-calculation",
  "rate-notification",
  "lodge_waitlist",
  "draft_prep_waitlist",
]
const ALLOWED_LEAD_CAPTURE_TRIGGERS: LeadCaptureTrigger[] = [
  "auto_after_calculation",
  "email_quote_button",
  "contextual_offer",
  "estimate_page",
]

let leadWriteQueue: Promise<void> = Promise.resolve()

class LeadStorageNotConfiguredError extends Error {
  constructor() {
    super("Lead persistence is not configured")
    this.name = "LeadStorageNotConfiguredError"
  }
}

class LeadWebhookError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "LeadWebhookError"
  }
}

class LeadEmailError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "LeadEmailError"
  }
}

async function ensureDataDirectory() {
  await fs.mkdir(DATA_DIR, { recursive: true })
}

async function writeJsonAtomic(filePath: string, payload: unknown): Promise<void> {
  await ensureDataDirectory()
  const tempPath = `${filePath}.tmp`
  await fs.writeFile(tempPath, JSON.stringify(payload, null, 2))
  await fs.rename(tempPath, filePath)
}

async function readLeads(): Promise<LeadCaptureData[]> {
  try {
    const data = await fs.readFile(LEADS_FILE, "utf-8")
    const parsed = JSON.parse(data)
    return Array.isArray(parsed) ? (parsed as LeadCaptureData[]) : []
  } catch {
    return []
  }
}

async function writeLeads(leads: LeadCaptureData[]): Promise<void> {
  await writeJsonAtomic(LEADS_FILE, leads)
}

function isValidSource(source: unknown): source is LeadCaptureRequest["source"] {
  return typeof source === "string" && ALLOWED_SOURCES.includes(source as LeadCaptureRequest["source"])
}

function isValidLeadCaptureTrigger(trigger: unknown): trigger is LeadCaptureTrigger {
  return typeof trigger === "string" && ALLOWED_LEAD_CAPTURE_TRIGGERS.includes(trigger as LeadCaptureTrigger)
}

function toFiniteNonNegativeNumber(value: unknown, fallback = 0): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return fallback
  }

  return value
}

function toBoundedUnits(value: unknown, fallback = 1): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > MAX_UNITS) {
    return fallback
  }

  return value
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function buildLeadData(body: LeadCaptureRequest): LeadCaptureData {
  const premium = toFiniteNonNegativeNumber(body.premium, 0)
  const qleave = toFiniteNonNegativeNumber(body.qleave, 0)

  return {
    leadReference: randomUUID(),
    reviewStatus: "pending_review",
    email: normalizeEmail(body.email),
    name: normalizeOptionalString(body.name),
    phone: normalizeOptionalString(body.phone),
    timestamp: new Date().toISOString(),
    source: body.source,
    quoteData: {
      workType: typeof body.workType === "string" ? body.workType : "",
      insurableValue: toFiniteNonNegativeNumber(body.insurableValue, 0),
      units: toBoundedUnits(body.units, 1),
      premium,
      qleave,
      total: premium + qleave,
    },
    analytics: {
      valueBand: normalizeOptionalString(body.valueBand),
      projectSegment: normalizeOptionalString(body.projectSegment),
      qleaveApplicable: typeof body.qleaveApplicable === "boolean" ? body.qleaveApplicable : undefined,
      recommendedOfferId: normalizeOptionalString(body.recommendedOfferId),
      recommendedOfferPartner: normalizeOptionalString(body.recommendedOfferPartner),
      leadCaptureTrigger: isValidLeadCaptureTrigger(body.leadCaptureTrigger) ? body.leadCaptureTrigger : undefined,
    },
  }
}

async function appendLead(leadData: LeadCaptureData): Promise<void> {
  const leads = await readLeads()
  leads.push(leadData)
  await writeLeads(leads)
}

async function appendLeadSerialized(leadData: LeadCaptureData): Promise<void> {
  const writeTask = leadWriteQueue.then(() => appendLead(leadData))
  leadWriteQueue = writeTask.catch(() => undefined)
  await writeTask
}

async function sendNotificationEmail(lead: LeadCaptureData) {
  const notificationData = {
    timestamp: new Date().toISOString(),
    lead,
    subject: `New QBCC Calculator Lead [${lead.leadReference}]`,
    message: `
New lead captured from QBCC Insurance Calculator:

Lead Reference: ${lead.leadReference}
Review Status: ${lead.reviewStatus}
Email: ${lead.email}
Name: ${lead.name || "Not provided"}
Phone: ${lead.phone || "Not provided"}
Source: ${lead.source}

Quote Details:
- Work Type: ${lead.quoteData.workType}
- Insurable Value: $${lead.quoteData.insurableValue.toLocaleString()}
- Units: ${lead.quoteData.units}
- QBCC Premium: $${lead.quoteData.premium.toFixed(2)}
- QLeave Levy: $${lead.quoteData.qleave.toFixed(2)}
- Total: $${lead.quoteData.total.toFixed(2)}

Captured at: ${lead.timestamp}
    `,
  }

  try {
    const existingRaw = await fs.readFile(NOTIFICATIONS_FILE, "utf-8")
    const existingParsed = JSON.parse(existingRaw)
    const notifications = Array.isArray(existingParsed) ? existingParsed : []
    notifications.push(notificationData)
    await writeJsonAtomic(NOTIFICATIONS_FILE, notifications)
  } catch {
    await writeJsonAtomic(NOTIFICATIONS_FILE, [notificationData])
  }
}

async function sendLeadWebhook(lead: LeadCaptureData): Promise<boolean> {
  if (!LEADS_WEBHOOK_URL) {
    return false
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (LEADS_WEBHOOK_SECRET) {
    headers.Authorization = `Bearer ${LEADS_WEBHOOK_SECRET}`
  }

  const response = await fetch(LEADS_WEBHOOK_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      event: "lead.captured",
      lead,
    }),
  })

  if (!response.ok) {
    const responseText = await response.text().catch(() => "")
    throw new LeadWebhookError(`Lead webhook failed with ${response.status}: ${responseText.slice(0, 300)}`)
  }

  return true
}

interface ResendEmailPayload {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}

async function sendResendEmail(payload: ResendEmailPayload): Promise<void> {
  if (!RESEND_API_KEY) {
    throw new LeadEmailError("RESEND_API_KEY is not configured")
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: LEAD_EMAIL_FROM,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      reply_to: payload.replyTo || LEAD_EMAIL_REPLY_TO,
    }),
  })

  if (!response.ok) {
    const responseText = await response.text().catch(() => "")
    throw new LeadEmailError(`Resend failed with ${response.status}: ${responseText.slice(0, 300)}`)
  }
}

async function sendLeadEmails(lead: LeadCaptureData): Promise<boolean> {
  if (!RESEND_API_KEY || !LEAD_NOTIFICATION_EMAIL) {
    return false
  }

  // For the MVP, email is the durable lead record: the operator receives the
  // full lead packet and the customer receives the quote they requested.
  await sendResendEmail({
    to: LEAD_NOTIFICATION_EMAIL,
    subject: `New QBCC Calculator Lead [${lead.leadReference}]`,
    html: buildLeadNotificationHtml(lead),
    replyTo: lead.email,
  })

  await sendResendEmail({
    to: lead.email,
    subject: `Your QBCC insurance estimate [${lead.leadReference}]`,
    html: buildQuoteEmailHtml(lead),
  })

  return true
}

async function persistLead(leadData: LeadCaptureData): Promise<void> {
  const webhookPersisted = await sendLeadWebhook(leadData)
  let emailPersisted = false

  try {
    emailPersisted = await sendLeadEmails(leadData)
  } catch (error) {
    if (!webhookPersisted) {
      throw error
    }

    console.error("Lead was persisted by webhook, but email notification failed:", error)
  }

  if (USE_LOCAL_LEAD_STORAGE) {
    await appendLeadSerialized(leadData)
    return
  }

  if (!webhookPersisted && !emailPersisted) {
    throw new LeadStorageNotConfiguredError()
  }
}

export async function POST(request: NextRequest) {
  try {
    let rawBody: unknown
    try {
      rawBody = (await request.json()) as unknown
    } catch {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Invalid request body",
        },
        { status: 400 },
      )
    }

    if (!rawBody || typeof rawBody !== "object") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Invalid request body",
        },
        { status: 400 },
      )
    }

    const body = rawBody as Partial<LeadCaptureRequest>
    const email = typeof body.email === "string" ? normalizeEmail(body.email) : ""

    if (!email || !isValidEmail(email)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Valid email is required",
        },
        { status: 400 },
      )
    }

    if (!isValidSource(body.source)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Source is required",
        },
        { status: 400 },
      )
    }

    const requestData: LeadCaptureRequest = {
      email,
      source: body.source,
      name: typeof body.name === "string" ? body.name : undefined,
      phone: typeof body.phone === "string" ? body.phone : undefined,
      workType: typeof body.workType === "string" ? body.workType : undefined,
      insurableValue: typeof body.insurableValue === "number" ? body.insurableValue : undefined,
      units: typeof body.units === "number" ? body.units : undefined,
      premium: typeof body.premium === "number" ? body.premium : undefined,
      qleave: typeof body.qleave === "number" ? body.qleave : undefined,
      valueBand: typeof body.valueBand === "string" ? body.valueBand : undefined,
      projectSegment: typeof body.projectSegment === "string" ? body.projectSegment : undefined,
      qleaveApplicable: typeof body.qleaveApplicable === "boolean" ? body.qleaveApplicable : undefined,
      recommendedOfferId: typeof body.recommendedOfferId === "string" ? body.recommendedOfferId : undefined,
      recommendedOfferPartner: typeof body.recommendedOfferPartner === "string" ? body.recommendedOfferPartner : undefined,
      leadCaptureTrigger: isValidLeadCaptureTrigger(body.leadCaptureTrigger) ? body.leadCaptureTrigger : undefined,
    }

    const leadData = buildLeadData(requestData)

    await persistLead(leadData)

    if (USE_LOCAL_LEAD_STORAGE) {
      sendNotificationEmail(leadData).catch((error) => {
        console.error("Failed to save notification:", error)
      })
    }

    return NextResponse.json<ApiResponse<{
      message: string
      leadReference: string
      reviewStatus: LeadCaptureData["reviewStatus"]
    }>>({
      success: true,
      data: {
        message: "Lead captured successfully",
        leadReference: leadData.leadReference,
        reviewStatus: leadData.reviewStatus,
      },
    })
  } catch (error) {
    if (error instanceof LeadStorageNotConfiguredError) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Lead persistence is not configured",
        },
        { status: 503 },
      )
    }

    if (error instanceof LeadWebhookError) {
      console.error("Error sending lead webhook:", error)
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Lead persistence failed",
        },
        { status: 502 },
      )
    }

    if (error instanceof LeadEmailError) {
      console.error("Error sending lead email:", error)
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Lead email delivery failed",
        },
        { status: 502 },
      )
    }

    console.error("Error capturing lead:", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    if (!USE_LOCAL_LEAD_STORAGE) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Local lead storage is disabled",
        },
        { status: 404 },
      )
    }

    const leads = await readLeads()
    return NextResponse.json<ApiResponse>({
      success: true,
      data: leads,
    })
  } catch (error) {
    console.error("Error reading leads:", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
