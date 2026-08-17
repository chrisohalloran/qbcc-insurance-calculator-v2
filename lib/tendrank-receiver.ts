import { createHash, createHmac, timingSafeEqual } from "crypto"
import {
  exactLiveTarget,
  isCreatableLiveSlug,
  isLivePageAction,
  safeJsonLd,
  sanitizeTendrankHtml,
} from "./tendrank-content"
import {
  getDraftById,
  getDraftByIdempotencyKey,
  getPublishedDraftBySlug,
  putDraft,
  type ReceiverDraft,
} from "./tendrank-draft-store"

export const DRAFT_CONTRACT = "2026-06-26.draft-v1"
export const APPROVE_CONTRACT = "2026-08-15.approve-v1"
export const ROLLBACK_CONTRACT = "2026-06-26.rollback-v1"
export const READBACK_CONTRACT = "2026-07-10.rollback-readback-v1"
export const DESTINATION_URL = "https://www.qbccinsurancecalculator.com.au/"
export const MAX_SKEW_SECONDS = 300

const SAFE_IDEMPOTENCY = /^[A-Za-z0-9:_-]+$/
const HTML_TAG = /<\s*(\/?)\s*([a-zA-Z0-9]+)([^>]*)>/g
const PUBLIC_HTML_TAGS = new Set([
  "article",
  "header",
  "section",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "a",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "blockquote",
  "small",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "img",
])

export type ReceiverResult = {
  status: number
  body: Record<string, unknown>
}

type DraftPacket = {
  contract_version?: unknown
  source?: unknown
  site_domain?: unknown
  source_site_id?: unknown
  source_post_id?: unknown
  source_session_id?: unknown
  idempotency_key?: unknown
  publish_policy?: unknown
  action_type?: unknown
  target_path?: unknown
  slug?: unknown
  title?: unknown
  meta_description?: unknown
  html_body?: unknown
  json_ld?: unknown
  brief?: unknown
}

type IdentityPacket = {
  contract_version?: unknown
  source?: unknown
  site_domain?: unknown
  source_site_id?: unknown
  external_id?: unknown
  slug?: unknown
  action?: unknown
  idempotency_key?: unknown
}

export function publishSecret(): string | null {
  const secret = process.env.TENDRANK_PUBLISH_SECRET
  return typeof secret === "string" && secret.trim() !== "" ? secret : null
}

export function draftIdFromKey(idempotencyKey: string): string {
  return createHash("sha256").update(`qbcc-tendrank:${idempotencyKey}`).digest("hex").slice(0, 32)
}

export function signBody(timestamp: string, rawBody: string, secret: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex")
}

function header(headers: Headers, name: string): string | null {
  const value = headers.get(name)
  return value && value.trim() !== "" ? value.trim() : null
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  return a.length === b.length && timingSafeEqual(a, b)
}

function presentString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== ""
}

function nowIso(): string {
  return new Date().toISOString()
}

function stringifyJsonLd(value: unknown): string | null {
  if (value == null || value === "") return null
  if (typeof value === "string") return value
  try {
    return JSON.stringify(value)
  } catch {
    return null
  }
}

export function verifyTendrankSignature(
  headers: Headers,
  rawBody: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): { ok: true; idempotencyKey: string } | { ok: false; status: number; error: string } {
  const secret = publishSecret()
  if (!secret) return { ok: false, status: 503, error: "tendrank_not_configured" }

  const timestamp = header(headers, "x-tendrank-timestamp")
  const signatureHeader = header(headers, "x-tendrank-signature")
  const idempotencyKey = header(headers, "x-tendrank-idempotency-key")

  if (!timestamp) return { ok: false, status: 401, error: "missing_timestamp" }
  if (!signatureHeader) return { ok: false, status: 401, error: "missing_signature" }
  if (!idempotencyKey) return { ok: false, status: 401, error: "missing_idempotency_key" }

  const unix = Number.parseInt(timestamp, 10)
  if (!Number.isFinite(unix) || String(unix) !== timestamp) {
    return { ok: false, status: 401, error: "missing_timestamp" }
  }
  if (Math.abs(nowSeconds - unix) > MAX_SKEW_SECONDS) {
    return { ok: false, status: 401, error: "stale_timestamp" }
  }

  const signature = signatureHeader.startsWith("sha256=")
    ? signatureHeader.slice("sha256=".length)
    : ""
  if (signature.length !== 64) return { ok: false, status: 401, error: "missing_signature" }

  const expected = signBody(timestamp, rawBody, secret)
  if (!safeEqual(signature, expected)) return { ok: false, status: 401, error: "invalid_signature" }

  return { ok: true, idempotencyKey }
}

function validatePublicHtml(html: string): "ok" | "empty_html" | "unsafe_html" {
  if (html.trim() === "") return "empty_html"

  const tags = [...html.matchAll(HTML_TAG)]
  const unmatched = html.replace(HTML_TAG, "")
  if (unmatched.includes("<") || unmatched.includes(">")) return "unsafe_html"

  for (const match of tags) {
    const closing = match[1]
    const name = match[2].toLowerCase()
    const attrs = match[3] ?? ""

    if (!PUBLIC_HTML_TAGS.has(name)) return "unsafe_html"
    if (closing === "/") {
      if (attrs.trim() !== "") return "unsafe_html"
      continue
    }
    if (name === "a") {
      const href = attrs.match(/^\s+href\s*=\s*(["'])([^"']+)\1\s*$/)
      if (!href || !href[2].startsWith("/") || href[2].startsWith("//")) return "unsafe_html"
      continue
    }
    if (name === "img") {
      const src = attrs.match(/\bsrc\s*=\s*(["'])([^"']+)\1/)
      const alt = attrs.match(/\balt\s*=\s*(["'])([^"']*)\1/)
      const srcValue = src?.[2] ?? ""
      const altValue = (alt?.[2] ?? "").trim()
      const relative =
        (srcValue.startsWith("/generated-images/") || srcValue.startsWith("/images/")) &&
        !srcValue.startsWith("//")
      const tendrank = srcValue.startsWith("https://tendrank.com/generated-images/")
      if (!src || !alt || !altValue || !(relative || tendrank)) return "unsafe_html"
      continue
    }
    if (attrs.trim() !== "") return "unsafe_html"
  }

  return "ok"
}

function validatePublicJsonLd(value: unknown): boolean {
  if (value == null || value === "") return true
  const json = stringifyJsonLd(value)
  return safeJsonLd(json) !== null
}

function sameDraft(existing: ReceiverDraft, next: ReceiverDraft): boolean {
  return (
    existing.idempotency_key === next.idempotency_key &&
    existing.slug === next.slug &&
    existing.title === next.title &&
    existing.html_body === next.html_body &&
    existing.action_type === next.action_type &&
    existing.target_path === next.target_path &&
    existing.meta_description === next.meta_description
  )
}

function rollbackMeta(draft: ReceiverDraft) {
  return {
    action: "archive",
    owned_by: "tendrank",
    external_id: draft.id,
    idempotency_key: draft.idempotency_key,
    url: "/api/tendrank/v1/drafts/rollback",
    readback_url: "/api/tendrank/v1/drafts/rollback/readback",
  }
}

function draftResponse(
  draft: ReceiverDraft,
  operation: "created" | "updated" | "existing",
  statusCode: number,
): ReceiverResult {
  const published = draft.status === "published"

  return {
    status: statusCode,
    body: {
      status: published ? "published" : operation === "existing" ? "created" : operation,
      operation,
      external_id: draft.id,
      admin_url: `/admin/tendrank-drafts/${draft.id}`,
      preview_url: null,
      public_url: published ? `${DESTINATION_URL.replace(/\/$/, "")}/${draft.slug}` : null,
      destination_url: DESTINATION_URL,
      idempotency_key: draft.idempotency_key,
      rollback: rollbackMeta(draft),
    },
  }
}

function errorResult(status: number, error: string): ReceiverResult {
  return { status, body: { error } }
}

function parseJson(rawBody: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(rawBody) as unknown
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

function validateCreatePacket(
  packet: DraftPacket,
  headerKey: string,
): { ok: true; draft: Omit<ReceiverDraft, "id" | "updated_at"> } | { ok: false; error: string } {
  if (packet.contract_version !== DRAFT_CONTRACT) return { ok: false, error: "invalid_contract_version" }
  if (packet.source !== "tendrank") return { ok: false, error: "invalid_source" }
  if (packet.publish_policy !== "draft_only" && packet.publish_policy !== "publish_live") {
    return { ok: false, error: "invalid_publish_policy" }
  }
  if (packet.idempotency_key !== headerKey) return { ok: false, error: "idempotency_key_mismatch" }
  if (!presentString(headerKey) || !SAFE_IDEMPOTENCY.test(headerKey)) {
    return { ok: false, error: "invalid_idempotency_key" }
  }
  if (!presentString(packet.site_domain)) return { ok: false, error: "invalid_packet" }
  if (!presentString(packet.source_site_id)) return { ok: false, error: "invalid_packet" }
  if (!presentString(packet.slug)) return { ok: false, error: "invalid_packet" }
  if (!presentString(packet.action_type)) return { ok: false, error: "invalid_packet" }
  if (!presentString(packet.title)) return { ok: false, error: "invalid_packet" }
  if (!presentString(packet.html_body)) return { ok: false, error: "invalid_packet" }
  if (!presentString(packet.target_path)) return { ok: false, error: "invalid_live_target_path" }

  if (!isCreatableLiveSlug(packet.slug)) return { ok: false, error: "reserved_or_unsafe_slug" }
  if (!isLivePageAction(packet.action_type)) return { ok: false, error: "unsupported_live_action" }
  if (!exactLiveTarget(packet.target_path, packet.slug)) {
    return { ok: false, error: "invalid_live_target_path" }
  }

  if (packet.publish_policy === "publish_live") {
    const htmlError = validatePublicHtml(packet.html_body)
    if (htmlError !== "ok") return { ok: false, error: htmlError }
    if (!validatePublicJsonLd(packet.json_ld)) return { ok: false, error: "invalid_json_ld" }
    if (sanitizeTendrankHtml(packet.html_body).trim() === "") {
      return { ok: false, error: "empty_html" }
    }
  }

  return {
    ok: true,
    draft: {
      idempotency_key: headerKey,
      source: "tendrank",
      site_domain: packet.site_domain,
      source_site_id: packet.source_site_id,
      source_post_id: presentString(packet.source_post_id) ? packet.source_post_id : null,
      source_session_id: presentString(packet.source_session_id) ? packet.source_session_id : null,
      slug: packet.slug,
      action_type: packet.action_type,
      status: packet.publish_policy === "publish_live" ? "published" : "review",
      title: packet.title,
      target_path: packet.target_path,
      meta_description: presentString(packet.meta_description) ? packet.meta_description : null,
      html_body: packet.html_body,
      json_ld: stringifyJsonLd(packet.json_ld),
      brief: presentString(packet.brief) ? packet.brief : null,
    },
  }
}

export function createReceiverDraft(headers: Headers, rawBody: string): ReceiverResult {
  const verified = verifyTendrankSignature(headers, rawBody)
  if (!verified.ok) return errorResult(verified.status, verified.error)

  const packet = parseJson(rawBody) as DraftPacket | null
  if (!packet) return errorResult(422, "invalid_packet")

  const validated = validateCreatePacket(packet, verified.idempotencyKey)
  if (!validated.ok) return errorResult(422, validated.error)

  const existing = getDraftByIdempotencyKey(verified.idempotencyKey)
  const next: ReceiverDraft = {
    ...validated.draft,
    id: existing?.id ?? draftIdFromKey(verified.idempotencyKey),
    updated_at: nowIso(),
  }

  if (existing?.status === "archived") return errorResult(422, "idempotency_rolled_back")
  if (existing?.status === "published") {
    return sameDraft(existing, next)
      ? draftResponse(existing, "existing", 200)
      : errorResult(422, "idempotency_conflict")
  }
  if (existing?.status === "review") {
    return draftResponse(putDraft({ ...next, id: existing.id }), "updated", 200)
  }

  const published = getPublishedDraftBySlug(next.slug)
  if (published && next.status === "published") {
    const updated = putDraft({
      ...published,
      ...next,
      id: published.id,
      status: "published",
    })
    return draftResponse(updated, "updated", 200)
  }

  return draftResponse(putDraft(next), "created", 201)
}

export function approveReceiverDraft(headers: Headers, rawBody: string): ReceiverResult {
  const verified = verifyTendrankSignature(headers, rawBody)
  if (!verified.ok) return errorResult(verified.status, verified.error)

  const packet = parseJson(rawBody) as IdentityPacket | null
  if (!packet) return errorResult(422, "invalid_packet")
  if (packet.contract_version !== APPROVE_CONTRACT) return errorResult(422, "invalid_contract_version")
  if (packet.source !== "tendrank") return errorResult(422, "invalid_source")
  if (packet.action !== "publish") return errorResult(422, "invalid_action")
  if (packet.idempotency_key !== verified.idempotencyKey) {
    return errorResult(422, "idempotency_key_mismatch")
  }
  if (!presentString(packet.external_id) || !presentString(packet.slug)) {
    return errorResult(422, "invalid_packet")
  }
  if (!isCreatableLiveSlug(packet.slug)) return errorResult(422, "reserved_or_unsafe_slug")

  const expectedId = draftIdFromKey(verified.idempotencyKey)
  const draft =
    getDraftById(packet.external_id) ??
    getDraftByIdempotencyKey(verified.idempotencyKey) ??
    (packet.external_id === expectedId
      ? {
          id: expectedId,
          idempotency_key: verified.idempotencyKey,
          source: "tendrank" as const,
          site_domain: presentString(packet.site_domain) ? packet.site_domain : "www.qbccinsurancecalculator.com.au",
          source_site_id: presentString(packet.source_site_id) ? packet.source_site_id : "unknown",
          source_post_id: null,
          source_session_id: null,
          slug: packet.slug,
          action_type: "new_article",
          status: "review" as const,
          title: packet.slug,
          target_path: `/${packet.slug}`,
          meta_description: null,
          html_body: "",
          json_ld: null,
          brief: null,
          updated_at: nowIso(),
        }
      : null)

  if (!draft) return errorResult(404, "draft_not_found")
  if (draft.slug !== packet.slug) return errorResult(422, "slug_mismatch")
  if (draft.status === "archived") return errorResult(422, "idempotency_rolled_back")

  const published = putDraft({ ...draft, status: "published", updated_at: nowIso() })
  return {
    status: 200,
    body: {
      status: "published",
      external_id: published.id,
      public_url: `${DESTINATION_URL.replace(/\/$/, "")}/${published.slug}`,
      destination_url: DESTINATION_URL,
      rollback: rollbackMeta(published),
    },
  }
}

export function rollbackReceiverDraft(headers: Headers, rawBody: string): ReceiverResult {
  const verified = verifyTendrankSignature(headers, rawBody)
  if (!verified.ok) return errorResult(verified.status, verified.error)

  const packet = parseJson(rawBody) as IdentityPacket | null
  if (!packet) return errorResult(422, "invalid_packet")
  if (packet.contract_version !== ROLLBACK_CONTRACT) return errorResult(422, "invalid_contract_version")
  if (packet.source !== "tendrank") return errorResult(422, "invalid_source")
  if (packet.action !== "archive") return errorResult(422, "invalid_action")
  if (!presentString(packet.external_id) || !presentString(packet.slug)) {
    return errorResult(422, "invalid_packet")
  }

  const draft = getDraftById(packet.external_id)
  if (!draft) return errorResult(404, "draft_not_found")
  if (draft.slug !== packet.slug) return errorResult(422, "slug_mismatch")

  if (draft.status === "archived") {
    return {
      status: 200,
      body: {
        status: "already_archived",
        external_id: draft.id,
        admin_url: `/admin/tendrank-drafts/${draft.id}`,
        idempotency_key: draft.idempotency_key,
        readback_url: "/api/tendrank/v1/drafts/rollback/readback",
      },
    }
  }

  const archived = putDraft({ ...draft, status: "archived", updated_at: nowIso() })
  return {
    status: 200,
    body: {
      status: "archived",
      external_id: archived.id,
      admin_url: `/admin/tendrank-drafts/${archived.id}`,
      idempotency_key: archived.idempotency_key,
      readback_url: "/api/tendrank/v1/drafts/rollback/readback",
    },
  }
}

export function readbackReceiverDraft(headers: Headers, rawBody: string): ReceiverResult {
  const verified = verifyTendrankSignature(headers, rawBody)
  if (!verified.ok) return errorResult(verified.status, verified.error)

  const packet = parseJson(rawBody) as IdentityPacket | null
  if (!packet) return errorResult(422, "invalid_packet")
  if (packet.contract_version !== READBACK_CONTRACT) return errorResult(422, "invalid_contract_version")
  if (packet.source !== "tendrank") return errorResult(422, "invalid_source")
  if (packet.action !== "readback") return errorResult(422, "invalid_action")
  if (!presentString(packet.external_id)) return errorResult(422, "invalid_packet")

  const draft = getDraftById(packet.external_id)
  if (!draft) return errorResult(404, "draft_not_found")

  const status = draft.status === "archived" ? "absent" : draft.status === "published" ? "published" : "draft"
  return {
    status: 200,
    body: {
      status,
      indexable: draft.status === "published",
      external_id: draft.id,
      slug: draft.slug,
      idempotency_key: verified.idempotencyKey,
    },
  }
}

export function publishedDraftAsPost(slug: string) {
  const draft = getPublishedDraftBySlug(slug)
  if (!draft) return null

  return {
    slug: draft.slug,
    title: draft.title,
    meta_description: draft.meta_description,
    action_type: draft.action_type,
    target_path: draft.target_path,
    updated_at: draft.updated_at,
    html_body: draft.html_body,
    brief: draft.brief,
    json_ld: draft.json_ld,
  }
}
