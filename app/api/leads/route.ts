import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"
import { ApiResponse, LeadCaptureData, LeadCaptureRequest } from "@/lib/types"
import { MAX_UNITS, isValidEmail, normalizeEmail } from "@/lib/validation"

const DATA_DIR = path.join(process.cwd(), "data")
const LEADS_FILE = path.join(DATA_DIR, "leads.json")
const NOTIFICATIONS_FILE = path.join(DATA_DIR, "notifications.json")
const ALLOWED_SOURCES: LeadCaptureRequest["source"][] = [
  "post-calculation",
  "pre-calculation",
  "rate-notification",
]

let leadWriteQueue: Promise<void> = Promise.resolve()

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
    subject: `New QBCC Calculator Lead: ${lead.email}`,
    message: `
New lead captured from QBCC Insurance Calculator:

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
    }

    const leadData = buildLeadData(requestData)

    await appendLeadSerialized(leadData)
    sendNotificationEmail(leadData).catch((error) => {
      console.error("Failed to save notification:", error)
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { message: "Lead captured successfully" },
    })
  } catch (error) {
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
