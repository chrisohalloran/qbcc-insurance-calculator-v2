import assert from "node:assert/strict"
import { afterEach, beforeEach, test } from "node:test"
import {
  CREATE_BLOCKED_SLUGS,
  isCreatableLiveSlug,
  isManagedLiveArticle,
} from "../lib/tendrank-content"
import { resetReceiverDrafts } from "../lib/tendrank-draft-store"
import {
  APPROVE_CONTRACT,
  DRAFT_CONTRACT,
  READBACK_CONTRACT,
  ROLLBACK_CONTRACT,
  approveReceiverDraft,
  createReceiverDraft,
  draftIdFromKey,
  publishedDraftAsPost,
  readbackReceiverDraft,
  rollbackReceiverDraft,
  signBody,
} from "../lib/tendrank-receiver"

const SECRET = "test-tendrank-shared-secret"

function signedHeaders(rawBody: string, idempotencyKey: string, timestamp = String(Math.floor(Date.now() / 1000))) {
  return new Headers({
    "content-type": "application/json",
    "x-tendrank-timestamp": timestamp,
    "x-tendrank-idempotency-key": idempotencyKey,
    "x-tendrank-signature": `sha256=${signBody(timestamp, rawBody, SECRET)}`,
  })
}

function draftPacket(overrides: Record<string, unknown> = {}) {
  return {
    contract_version: DRAFT_CONTRACT,
    source: "tendrank",
    site_domain: "www.qbccinsurancecalculator.com.au",
    source_site_id: "site-1",
    source_post_id: "post-1",
    source_session_id: "session-1",
    idempotency_key: "tendrank:site-1:sample-insurance-guide",
    publish_policy: "draft_only",
    action_type: "new_article",
    target_path: "/sample-insurance-guide",
    slug: "sample-insurance-guide",
    title: "QBCC premium table",
    meta_description: "GST-inclusive premium table.",
    html_body: "<h1>QBCC premium table</h1><p>Rates by project value.</p>",
    json_ld: JSON.stringify({ "@type": "Article", name: "QBCC premium table" }),
    brief: "{}",
    ...overrides,
  }
}

function post(handler: typeof createReceiverDraft, packet: Record<string, unknown>, key = String(packet.idempotency_key)) {
  const rawBody = JSON.stringify(packet)
  return handler(signedHeaders(rawBody, key), rawBody)
}

beforeEach(() => {
  process.env.TENDRANK_PUBLISH_SECRET = SECRET
  resetReceiverDrafts()
})

afterEach(() => {
  resetReceiverDrafts()
})

test("creates a signed review draft for a new slug", () => {
  const result = post(createReceiverDraft, draftPacket())

  assert.equal(result.status, 201)
  assert.equal(result.body.status, "created")
  assert.equal(result.body.external_id, draftIdFromKey("tendrank:site-1:sample-insurance-guide"))
  assert.equal(result.body.public_url, null)
  assert.deepEqual(result.body.rollback, {
    action: "archive",
    owned_by: "tendrank",
    external_id: result.body.external_id,
    idempotency_key: "tendrank:site-1:sample-insurance-guide",
    url: "/api/tendrank/v1/drafts/rollback",
    readback_url: "/api/tendrank/v1/drafts/rollback/readback",
  })
  assert.equal(publishedDraftAsPost("sample-insurance-guide"), null)
})

test("publishes a validated live new page and serves the slug from the receiver store", () => {
  const result = post(
    createReceiverDraft,
    draftPacket({
      publish_policy: "publish_live",
      idempotency_key: "tendrank:site-1:live-sample-insurance-guide",
    }),
    "tendrank:site-1:live-sample-insurance-guide",
  )

  assert.equal(result.status, 201)
  assert.equal(result.body.status, "published")
  assert.equal(result.body.public_url, "https://www.qbccinsurancecalculator.com.au/sample-insurance-guide")
  assert.equal(publishedDraftAsPost("sample-insurance-guide")?.title, "QBCC premium table")
})

test("approve publishes a previously created review draft", () => {
  const created = post(createReceiverDraft, draftPacket())
  const approvePacket = {
    contract_version: APPROVE_CONTRACT,
    source: "tendrank",
    site_domain: "www.qbccinsurancecalculator.com.au",
    source_site_id: "site-1",
    external_id: created.body.external_id,
    slug: "sample-insurance-guide",
    action: "publish",
    idempotency_key: "tendrank:site-1:sample-insurance-guide",
  }
  const rawBody = JSON.stringify(approvePacket)
  const approved = approveReceiverDraft(
    signedHeaders(rawBody, "tendrank:site-1:sample-insurance-guide"),
    rawBody,
  )

  assert.equal(approved.status, 200)
  assert.equal(approved.body.status, "published")
  assert.equal(publishedDraftAsPost("sample-insurance-guide")?.slug, "sample-insurance-guide")
})

test("approve of a matching deterministic id succeeds even if create landed on another instance", () => {
  const key = "tendrank:site-1:cross-instance"
  const approvePacket = {
    contract_version: APPROVE_CONTRACT,
    source: "tendrank",
    site_domain: "www.qbccinsurancecalculator.com.au",
    source_site_id: "site-1",
    external_id: draftIdFromKey(key),
    slug: "sample-insurance-guide",
    action: "publish",
    idempotency_key: key,
  }
  const rawBody = JSON.stringify(approvePacket)
  const approved = approveReceiverDraft(signedHeaders(rawBody, key), rawBody)

  assert.equal(approved.status, 200)
  assert.equal(approved.body.status, "published")
})

test("rejects reserved and homepage slugs so costs is untouched", () => {
  for (const slug of ["costs", "home", "homepage", "faq", "premium-table"]) {
    const result = post(
      createReceiverDraft,
      draftPacket({
        slug,
        target_path: `/${slug}`,
        idempotency_key: `tendrank:site-1:${slug}`,
      }),
      `tendrank:site-1:${slug}`,
    )

    assert.equal(result.status, 422, slug)
    assert.equal(result.body.error, "reserved_or_unsafe_slug", slug)
    assert.equal(isCreatableLiveSlug(slug), false, slug)
  }

  assert.ok(CREATE_BLOCKED_SLUGS.has("costs"))
})

test("rejects unsigned, stale, and unconfigured create attempts with explicit errors instead of 404", () => {
  const packet = draftPacket()
  const rawBody = JSON.stringify(packet)

  const unsigned = createReceiverDraft(new Headers({ "x-tendrank-idempotency-key": "x" }), rawBody)
  assert.equal(unsigned.status, 401)

  const stale = createReceiverDraft(
    signedHeaders(rawBody, "tendrank:site-1:sample-insurance-guide", String(Math.floor(Date.now() / 1000) - 400)),
    rawBody,
  )
  assert.equal(stale.status, 401)
  assert.equal(stale.body.error, "stale_timestamp")

  process.env.TENDRANK_PUBLISH_SECRET = ""
  const unconfigured = post(createReceiverDraft, packet)
  assert.equal(unconfigured.status, 503)
  assert.equal(unconfigured.body.error, "tendrank_not_configured")
})

test("rejects unsafe live HTML and mismatched target paths", () => {
  const unsafe = post(
    createReceiverDraft,
    draftPacket({
      publish_policy: "publish_live",
      html_body: "<h1>Nope</h1><script>alert(1)</script>",
      idempotency_key: "tendrank:site-1:unsafe",
    }),
    "tendrank:site-1:unsafe",
  )
  assert.equal(unsafe.status, 422)
  assert.equal(unsafe.body.error, "unsafe_html")

  const mismatch = post(
    createReceiverDraft,
    draftPacket({
      slug: "sample-insurance-guide",
      target_path: "/costs",
      idempotency_key: "tendrank:site-1:mismatch",
    }),
    "tendrank:site-1:mismatch",
  )
  assert.equal(mismatch.status, 422)
  assert.equal(mismatch.body.error, "invalid_live_target_path")
})

test("rollback archives a created draft and readback reports it absent", () => {
  const created = post(createReceiverDraft, draftPacket())
  const rollbackPacket = {
    contract_version: ROLLBACK_CONTRACT,
    source: "tendrank",
    site_domain: "www.qbccinsurancecalculator.com.au",
    source_site_id: "site-1",
    external_id: created.body.external_id,
    slug: "sample-insurance-guide",
    action: "archive",
    idempotency_key: "tendrank:rollback:site-1:sample-insurance-guide",
  }
  const rollbackBody = JSON.stringify(rollbackPacket)
  const rolled = rollbackReceiverDraft(
    signedHeaders(rollbackBody, "tendrank:rollback:site-1:sample-insurance-guide"),
    rollbackBody,
  )
  assert.equal(rolled.status, 200)
  assert.equal(rolled.body.status, "archived")

  const readbackPacket = {
    contract_version: READBACK_CONTRACT,
    source: "tendrank",
    site_domain: "www.qbccinsurancecalculator.com.au",
    source_site_id: "site-1",
    external_id: created.body.external_id,
    slug: "sample-insurance-guide",
    action: "readback",
    idempotency_key: "tendrank:rollback:site-1:sample-insurance-guide:readback",
  }
  const readbackBody = JSON.stringify(readbackPacket)
  const readback = readbackReceiverDraft(
    signedHeaders(readbackBody, "tendrank:rollback:site-1:sample-insurance-guide:readback"),
    readbackBody,
  )
  assert.equal(readback.status, 200)
  assert.equal(readback.body.status, "absent")
  assert.equal(readback.body.indexable, false)
})

test("managed live renderer accepts a new-page page_update for a non-reserved slug", () => {
  assert.equal(
    isManagedLiveArticle({
      slug: "sample-insurance-guide",
      title: "QBCC premium table",
      meta_description: null,
      action_type: "page_update",
      target_path: "/sample-insurance-guide",
      updated_at: "2026-08-16T00:00:00Z",
    }),
    true,
  )
  assert.equal(
    isManagedLiveArticle({
      slug: "costs",
      title: "Costs",
      meta_description: null,
      action_type: "page_update",
      target_path: "/costs",
      updated_at: "2026-08-16T00:00:00Z",
    }),
    false,
  )
})
