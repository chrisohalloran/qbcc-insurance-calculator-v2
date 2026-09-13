import { calculateQuote, WorkType } from "@/lib/quote";
import { buildQuoteAnalyticsProperties } from "@/lib/lead-segmentation";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID, createHash } from "node:crypto";
import fs from "fs/promises";
import path from "path";
import { buildLeadNotificationHtml } from "@/emails/lead-notification";
import { buildQuoteEmailHtml } from "@/emails/quote-email";
import {
  ApiResponse,
  LeadCaptureData,
  LeadCaptureRequest,
  LeadCaptureTrigger,
} from "@/lib/types";
import { MAX_UNITS, isValidEmail, normalizeEmail } from "@/lib/validation";

export const runtime = "nodejs";

const DEFAULT_DATA_DIR = path.join(process.cwd(), "data");
const LOCAL_DATA_DIR = process.env.LEADS_DATA_DIR?.trim();
const DATA_DIR =
  process.env.LEADS_STORAGE_MODE === "local" && LOCAL_DATA_DIR
    ? path.resolve(LOCAL_DATA_DIR)
    : DEFAULT_DATA_DIR;
const LEADS_FILE = path.join(DATA_DIR, "leads.json");
const NOTIFICATIONS_FILE = path.join(DATA_DIR, "notifications.json");
const LEADS_WEBHOOK_URL = process.env.LEADS_WEBHOOK_URL?.trim();
const LEADS_WEBHOOK_SECRET = process.env.LEADS_WEBHOOK_SECRET?.trim();
const RESEND_API_KEY = process.env.RESEND_API_KEY?.trim();
const LEAD_NOTIFICATION_EMAIL =
  process.env.LEAD_NOTIFICATION_EMAIL?.trim() ||
  process.env.NOTIFICATION_EMAIL?.trim();
const LEAD_EMAIL_FROM =
  process.env.LEAD_EMAIL_FROM?.trim() ||
  "QBCC Calculator <quotes@mail.levasolutions.com.au>";
const LEAD_EMAIL_REPLY_TO =
  process.env.LEAD_EMAIL_REPLY_TO?.trim() || LEAD_NOTIFICATION_EMAIL;
const USE_LOCAL_LEAD_STORAGE =
  process.env.VERCEL !== "1" &&
  (process.env.LEADS_STORAGE_MODE === "local" ||
    process.env.NODE_ENV !== "production");
const ALLOWED_SOURCES: LeadCaptureRequest["source"][] = [
  "post-calculation",
  "pre-calculation",
  "rate-notification",
  "lodge_waitlist",
  "draft_prep_waitlist",
];
const ALLOWED_LEAD_CAPTURE_TRIGGERS: LeadCaptureTrigger[] = [
  "auto_after_calculation",
  "email_quote_button",
  "contextual_offer",
  "estimate_page",
  "draft_prep_waitlist",
];

let leadWriteQueue: Promise<void> = Promise.resolve();

class LeadStorageNotConfiguredError extends Error {
  constructor() {
    super("Lead persistence is not configured");
    this.name = "LeadStorageNotConfiguredError";
  }
}

class LeadWebhookError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LeadWebhookError";
  }
}

class LeadEmailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LeadEmailError";
  }
}

async function ensureDataDirectory() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function writeJsonAtomic(
  filePath: string,
  payload: unknown,
): Promise<void> {
  await ensureDataDirectory();
  const tempPath = `${filePath}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(payload, null, 2));
  await fs.rename(tempPath, filePath);
}

async function readLeads(): Promise<LeadCaptureData[]> {
  try {
    const data = await fs.readFile(LEADS_FILE, "utf-8");
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? (parsed as LeadCaptureData[]) : [];
  } catch {
    return [];
  }
}

async function writeLeads(leads: LeadCaptureData[]): Promise<void> {
  await writeJsonAtomic(LEADS_FILE, leads);
}

function isValidSource(
  source: unknown,
): source is LeadCaptureRequest["source"] {
  return (
    typeof source === "string" &&
    ALLOWED_SOURCES.includes(source as LeadCaptureRequest["source"])
  );
}

function isValidLeadCaptureTrigger(
  trigger: unknown,
): trigger is LeadCaptureTrigger {
  return (
    typeof trigger === "string" &&
    ALLOWED_LEAD_CAPTURE_TRIGGERS.includes(trigger as LeadCaptureTrigger)
  );
}

function toFiniteNonNegativeNumber(value: unknown, fallback = 0): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return fallback;
  }

  return value;
}

function toBoundedUnits(value: unknown, fallback = 1): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > MAX_UNITS
  ) {
    return fallback;
  }

  return value;
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function buildLeadData(body: LeadCaptureRequest): LeadCaptureData {
  const quote =
    body.source === "rate-notification" || body.source === "pre-calculation"
      ? null
      : calculateQuote({
          workType: body.workType as WorkType,
          insurableValue: body.insurableValue!,
          units: body.units!,
          qleaveCostExGst: body.qleaveCostExGst,
        });
  const premium = quote?.premium ?? 0;
  const qleave = quote?.qleave ?? 0;
  const segmentation = quote ? buildQuoteAnalyticsProperties(quote) : null;

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
      insurableValue: quote?.insurableValue ?? 0,
      units: toBoundedUnits(body.units, 1),
      premium,
      qleave,
      total: quote?.total ?? 0,
      qleaveCostExGst: quote?.qleaveCostExGst,
      rateVersion: quote?.rateVersion,
    },
    analytics: {
      valueBand: segmentation?.value_band,
      projectSegment: segmentation?.project_segment,
      qleaveApplicable: segmentation?.qleave_applicable,
      recommendedOfferId: segmentation?.recommended_offer_id,
      recommendedOfferPartner: segmentation?.recommended_offer_partner,
      leadCaptureTrigger: isValidLeadCaptureTrigger(body.leadCaptureTrigger)
        ? body.leadCaptureTrigger
        : undefined,
    },
  };
}

async function appendLead(leadData: LeadCaptureData): Promise<void> {
  const leads = await readLeads();
  leads.push(leadData);
  await writeLeads(leads);
}

async function appendLeadSerialized(leadData: LeadCaptureData): Promise<void> {
  const writeTask = leadWriteQueue.then(() => appendLead(leadData));
  leadWriteQueue = writeTask.catch(() => undefined);
  await writeTask;
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
  };

  try {
    const existingRaw = await fs.readFile(NOTIFICATIONS_FILE, "utf-8");
    const existingParsed = JSON.parse(existingRaw);
    const notifications = Array.isArray(existingParsed) ? existingParsed : [];
    notifications.push(notificationData);
    await writeJsonAtomic(NOTIFICATIONS_FILE, notifications);
  } catch {
    await writeJsonAtomic(NOTIFICATIONS_FILE, [notificationData]);
  }
}

async function sendLeadWebhook(lead: LeadCaptureData): Promise<boolean> {
  if (!LEADS_WEBHOOK_URL) {
    return false;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (LEADS_WEBHOOK_SECRET) {
    headers.Authorization = `Bearer ${LEADS_WEBHOOK_SECRET}`;
  }

  const response = await fetch(LEADS_WEBHOOK_URL, {
    method: "POST",
    headers: { ...headers, "Idempotency-Key": lead.leadReference },
    signal: AbortSignal.timeout(8000),
    body: JSON.stringify({
      event: "lead.captured",
      lead,
    }),
  });

  if (!response.ok) {
    const responseText = await response.text().catch(() => "");
    throw new LeadWebhookError(
      `Lead webhook failed with ${response.status}: ${responseText.slice(0, 300)}`,
    );
  }

  return true;
}

interface ResendEmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  idempotencyKey: string;
}

async function sendResendEmail(payload: ResendEmailPayload): Promise<void> {
  if (!RESEND_API_KEY) {
    throw new LeadEmailError("RESEND_API_KEY is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": payload.idempotencyKey,
    },
    signal: AbortSignal.timeout(8000),
    body: JSON.stringify({
      from: LEAD_EMAIL_FROM,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      reply_to: payload.replyTo || LEAD_EMAIL_REPLY_TO,
    }),
  });

  if (!response.ok) {
    const responseText = await response.text().catch(() => "");
    throw new LeadEmailError(
      `Resend failed with ${response.status}: ${responseText.slice(0, 300)}`,
    );
  }
}

async function sendLeadEmails(
  lead: LeadCaptureData,
): Promise<{ record: boolean; customer: boolean }> {
  if (!RESEND_API_KEY || !LEAD_NOTIFICATION_EMAIL) {
    return { record: false, customer: false };
  }

  // For the MVP, email is the durable lead record: the operator receives the
  // full lead packet and the customer receives the quote they requested.
  await sendResendEmail({
    idempotencyKey: `${lead.leadReference}-operator`,
    to: LEAD_NOTIFICATION_EMAIL,
    subject: `New QBCC Calculator Lead [${lead.leadReference}]`,
    html: buildLeadNotificationHtml(lead),
    replyTo: lead.email,
  });

  if (lead.source !== "post-calculation")
    return { record: true, customer: false };
  try {
    await sendResendEmail({
      idempotencyKey: `${lead.leadReference}-customer`,
      to: lead.email,
      subject: `Your QBCC insurance estimate [${lead.leadReference}]`,
      html: buildQuoteEmailHtml(lead),
    });
  } catch {
    console.error("Customer quote email was not accepted", {
      leadReference: lead.leadReference,
    });
    return { record: true, customer: false };
  }

  return { record: true, customer: true };
}

async function persistLead(
  leadData: LeadCaptureData,
): Promise<"sent" | "saved"> {
  const results = await Promise.allSettled([
    sendLeadWebhook(leadData),
    sendLeadEmails(leadData),
  ]);
  const webhookPersisted =
    results[0].status === "fulfilled" && results[0].value;
  const emailPersisted =
    results[1].status === "fulfilled" && results[1].value.record;
  const customerSent =
    results[1].status === "fulfilled" && results[1].value.customer;
  if (USE_LOCAL_LEAD_STORAGE) await appendLeadSerialized(leadData);
  if (!USE_LOCAL_LEAD_STORAGE && !webhookPersisted && !emailPersisted) {
    if (!LEADS_WEBHOOK_URL && !RESEND_API_KEY)
      throw new LeadStorageNotConfiguredError();
    throw new LeadEmailError("Delivery destinations unavailable");
  }
  return customerSent ? "sent" : "saved";
}
const requests = new Map<string, { count: number; until: number }>();
const receipts = new Map<
  string,
  {
    fingerprint: string;
    until: number;
    result: Promise<{
      lead: LeadCaptureData;
      deliveryStatus: "sent" | "saved";
    }>;
  }
>();
function limited(key: string) {
  const now = Date.now();
  for (const [k, v] of requests) if (v.until < now) requests.delete(k);
  if (requests.size >= 10000 && !requests.has(key)) return true;
  const item = requests.get(key) ?? { count: 0, until: now + 60000 };
  item.count++;
  requests.set(key, item);
  return item.count > 10;
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (
      origin &&
      origin !== `http://${request.headers.get("host")}` &&
      origin !== `https://${request.headers.get("host")}` &&
      origin !== request.nextUrl.origin &&
      origin !== "https://www.qbccinsurancecalculator.com.au"
    )
      return NextResponse.json(
        { success: false, error: "Invalid origin" },
        { status: 403 },
      );
    if (
      limited(
        request.headers.get("x-vercel-forwarded-for") ||
          request.headers.get("x-forwarded-for") ||
          "local",
      )
    )
      return NextResponse.json(
        {
          success: false,
          error: "Too many requests. Please try again in a minute.",
        },
        { status: 429, headers: { "Retry-After": "60" } },
      );
    if (Number(request.headers.get("content-length") || 0) > 16384)
      return NextResponse.json(
        { success: false, error: "Request too large" },
        { status: 413 },
      );
    let rawBody: unknown;
    try {
      const raw = await request.text();
      if (raw.length > 16384)
        return NextResponse.json(
          { success: false, error: "Request too large" },
          { status: 413 },
        );
      rawBody = JSON.parse(raw) as unknown;
    } catch {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Invalid request body",
        },
        { status: 400 },
      );
    }

    if (!rawBody || typeof rawBody !== "object") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Invalid request body",
        },
        { status: 400 },
      );
    }

    const body = rawBody as Partial<LeadCaptureRequest>;
    const email =
      typeof body.email === "string" ? normalizeEmail(body.email) : "";

    if (!email || email.length > 254 || !isValidEmail(email)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Valid email is required",
        },
        { status: 400 },
      );
    }

    if (!isValidSource(body.source)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Source is required",
        },
        { status: 400 },
      );
    }

    const requestData: LeadCaptureRequest = {
      email,
      source: body.source,
      name: typeof body.name === "string" ? body.name : undefined,
      phone: typeof body.phone === "string" ? body.phone : undefined,
      workType: typeof body.workType === "string" ? body.workType : undefined,
      insurableValue:
        typeof body.insurableValue === "number"
          ? body.insurableValue
          : undefined,
      units: typeof body.units === "number" ? body.units : undefined,
      qleaveCostExGst: body.qleaveCostExGst,
      premium: typeof body.premium === "number" ? body.premium : undefined,
      qleave: typeof body.qleave === "number" ? body.qleave : undefined,
      valueBand:
        typeof body.valueBand === "string" ? body.valueBand : undefined,
      projectSegment:
        typeof body.projectSegment === "string"
          ? body.projectSegment
          : undefined,
      qleaveApplicable:
        typeof body.qleaveApplicable === "boolean"
          ? body.qleaveApplicable
          : undefined,
      recommendedOfferId:
        typeof body.recommendedOfferId === "string"
          ? body.recommendedOfferId
          : undefined,
      recommendedOfferPartner:
        typeof body.recommendedOfferPartner === "string"
          ? body.recommendedOfferPartner
          : undefined,
      leadCaptureTrigger: isValidLeadCaptureTrigger(body.leadCaptureTrigger)
        ? body.leadCaptureTrigger
        : undefined,
    };

    if ((body.name?.length ?? 0) > 200 || (body.phone?.length ?? 0) > 40)
      return NextResponse.json(
        { success: false, error: "Contact details are too long" },
        { status: 400 },
      );
    let leadData: LeadCaptureData;
    try {
      leadData = buildLeadData(requestData);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error:
            error instanceof Error ? error.message : "Invalid project details",
        },
        { status: 400 },
      );
    }
    const idempotencyKey = request.headers.get("idempotency-key");
    if (idempotencyKey && !/^[a-zA-Z0-9-]{16,80}$/.test(idempotencyKey))
      return NextResponse.json(
        { success: false, error: "Invalid request key" },
        { status: 400 },
      );
    const fingerprint = createHash("sha256")
      .update(JSON.stringify(requestData))
      .digest("hex");
    const key = idempotencyKey
      ? createHash("sha256")
          .update(email + idempotencyKey)
          .digest("hex")
      : randomUUID();
    const now = Date.now();
    for (const [k, v] of receipts) if (v.until < now) receipts.delete(k);
    if (receipts.size >= 10000 && !receipts.has(key))
      return NextResponse.json(
        { success: false, error: "Please try again later" },
        { status: 503 },
      );
    const previous = receipts.get(key);
    if (previous && previous.fingerprint !== fingerprint)
      return NextResponse.json(
        { success: false, error: "Request key already used" },
        { status: 409 },
      );
    if (idempotencyKey)
      leadData.leadReference = `${key.slice(0, 8)}-${key.slice(8, 12)}-4${key.slice(13, 16)}-a${key.slice(17, 20)}-${key.slice(20, 32)}`;
    const result =
      previous?.result ??
      persistLead(leadData).then((deliveryStatus) => ({
        lead: leadData,
        deliveryStatus,
      }));
    if (!previous)
      receipts.set(key, { fingerprint, until: now + 86400000, result });
    let receipt;
    try {
      receipt = await result;
    } catch (error) {
      receipts.delete(key);
      throw error;
    }
    leadData = receipt.lead;

    if (USE_LOCAL_LEAD_STORAGE && !previous) {
      sendNotificationEmail(leadData).catch((error) => {
        console.error("Failed to save notification:", error);
      });
    }

    return NextResponse.json<
      ApiResponse<{
        deliveryStatus: "sent" | "saved";
        message: string;
        leadReference: string;
        reviewStatus: LeadCaptureData["reviewStatus"];
      }>
    >({
      success: true,
      data: {
        message: "Lead captured successfully",
        deliveryStatus: receipt.deliveryStatus,
        leadReference: leadData.leadReference,
        reviewStatus: leadData.reviewStatus,
      },
    });
  } catch (error) {
    if (error instanceof LeadStorageNotConfiguredError) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Lead persistence is not configured",
        },
        { status: 503 },
      );
    }

    if (error instanceof LeadWebhookError) {
      console.error("Error sending lead webhook:", error);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Lead persistence failed",
        },
        { status: 502 },
      );
    }

    if (error instanceof LeadEmailError) {
      console.error("Error sending lead email:", error);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Lead email delivery failed",
        },
        { status: 502 },
      );
    }

    console.error("Error capturing lead:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
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
      );
    }

    const leads = await readLeads();
    return NextResponse.json<ApiResponse>({
      success: true,
      data: leads,
    });
  } catch (error) {
    console.error("Error reading leads:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
