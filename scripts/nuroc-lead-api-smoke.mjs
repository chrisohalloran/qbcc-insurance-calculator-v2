import assert from "node:assert/strict"
import { once } from "node:events"
import { existsSync } from "node:fs"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { createServer as createHttpServer } from "node:http"
import { createServer } from "node:net"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { spawn } from "node:child_process"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next")
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const testLead = {
  email: "nuroc-runtime-smoke@example.com",
  name: "Controlled Runtime Smoke",
  phone: "0400 000 000",
  source: "post-calculation",
  workType: "renovation",
  insurableValue: 100000,
  units: 1,
  premium: 1000,
  qleave: 500,
  valueBand: "100k_to_250k",
  projectSegment: "renovation_small",
  qleaveApplicable: true,
  recommendedOfferId: "qbcc-calculator",
  recommendedOfferPartner: "QBCC Calculator",
  leadCaptureTrigger: "email_quote_button",
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function reservePort() {
  const server = createServer()
  server.listen(0, "127.0.0.1")
  await once(server, "listening")
  const address = server.address()
  assert(address && typeof address === "object")
  const port = address.port
  server.close()
  await once(server, "close")
  return port
}

async function startWebhookServer(secret) {
  const requests = []
  const server = createHttpServer(async (request, response) => {
    const chunks = []
    for await (const chunk of request) {
      chunks.push(chunk)
    }

    const rawBody = Buffer.concat(chunks).toString("utf8")
    requests.push({
      method: request.method,
      authorization: request.headers.authorization,
      contentType: request.headers["content-type"],
      body: JSON.parse(rawBody),
    })

    response.writeHead(204)
    response.end()
  })

  server.listen(0, "127.0.0.1")
  await once(server, "listening")
  const address = server.address()
  assert(address && typeof address === "object")

  return {
    server,
    requests,
    url: `http://127.0.0.1:${address.port}/leads`,
    secret,
  }
}

async function stopServer(server) {
  if (!server?.listening) {
    return
  }

  server.close()
  await once(server, "close")
}

async function waitForApi(baseUrl, child, getLogs, readyStatuses = [200]) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`Next.js exited before the smoke test was ready.\n${getLogs()}`)
    }

    try {
      const response = await fetch(`${baseUrl}/api/leads`)
      if (readyStatuses.includes(response.status)) {
        return
      }
    } catch {
      // The loopback server may still be starting.
    }

    await delay(250)
  }

  throw new Error(`Timed out waiting for the local lead API.\n${getLogs()}`)
}

async function waitForJson(filePath) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      return JSON.parse(await readFile(filePath, "utf8"))
    } catch {
      await delay(125)
    }
  }

  throw new Error(`Timed out waiting for ${path.basename(filePath)}`)
}

async function stopChild(child) {
  if (!child || child.exitCode !== null) {
    return
  }

  child.kill("SIGTERM")
  const exited = once(child, "exit")
  const timedOut = delay(5000).then(() => "timeout")
  if ((await Promise.race([exited, timedOut])) === "timeout" && child.exitCode === null) {
    child.kill("SIGKILL")
    await once(child, "exit")
  }
}

async function postJson(url, payload) {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

const dataDir = await mkdtemp(path.join(tmpdir(), "qbcc-lead-api-smoke-"))
const defaultLeadsFile = path.join(root, "data", "leads.json")
const defaultNotificationsFile = path.join(root, "data", "notifications.json")
let child
let webhookServer
let serverLogs = ""
let result
let failure

try {
  const failClosedPort = await reservePort()
  const failClosedBaseUrl = `http://127.0.0.1:${failClosedPort}`
  const failClosedEnv = {
    ...process.env,
    NODE_ENV: "production",
    LEADS_STORAGE_MODE: "",
    LEADS_DATA_DIR: "",
    RESEND_API_KEY: "",
    LEADS_WEBHOOK_URL: "",
    LEADS_WEBHOOK_SECRET: "",
    LEAD_NOTIFICATION_EMAIL: "",
    NOTIFICATION_EMAIL: "",
  }

  child = spawn(process.execPath, [nextBin, "start", "-H", "127.0.0.1", "-p", String(failClosedPort)], {
    cwd: root,
    env: failClosedEnv,
    stdio: ["ignore", "pipe", "pipe"],
  })

  const captureLog = (chunk) => {
    serverLogs = `${serverLogs}${chunk.toString()}`.slice(-12000)
  }
  child.stdout.on("data", captureLog)
  child.stderr.on("data", captureLog)

  await waitForApi(failClosedBaseUrl, child, () => serverLogs, [404])

  const failClosedListResponse = await fetch(`${failClosedBaseUrl}/api/leads`)
  assert.equal(failClosedListResponse.status, 404)
  const failClosedListBody = await failClosedListResponse.json()
  assert.equal(failClosedListBody.success, false)
  assert.equal(failClosedListBody.error, "Local lead storage is disabled")

  const failClosedPostResponse = await postJson(`${failClosedBaseUrl}/api/leads`, testLead)
  assert.equal(failClosedPostResponse.status, 503)
  const failClosedPostBody = await failClosedPostResponse.json()
  assert.equal(failClosedPostBody.success, false)
  assert.equal(failClosedPostBody.error, "Lead persistence is not configured")
  assert.equal(existsSync(defaultLeadsFile), false)
  assert.equal(existsSync(defaultNotificationsFile), false)

  await stopChild(child)
  child = undefined
  serverLogs = ""

  const webhookSecret = "nuroc-loopback-webhook-secret"
  const webhookHarness = await startWebhookServer(webhookSecret)
  webhookServer = webhookHarness.server
  const webhookPort = await reservePort()
  const webhookBaseUrl = `http://127.0.0.1:${webhookPort}`
  const webhookEnv = {
    ...process.env,
    NODE_ENV: "production",
    LEADS_STORAGE_MODE: "",
    LEADS_DATA_DIR: "",
    RESEND_API_KEY: "",
    LEADS_WEBHOOK_URL: webhookHarness.url,
    LEADS_WEBHOOK_SECRET: webhookSecret,
    LEAD_NOTIFICATION_EMAIL: "",
    NOTIFICATION_EMAIL: "",
  }

  child = spawn(process.execPath, [nextBin, "start", "-H", "127.0.0.1", "-p", String(webhookPort)], {
    cwd: root,
    env: webhookEnv,
    stdio: ["ignore", "pipe", "pipe"],
  })

  child.stdout.on("data", captureLog)
  child.stderr.on("data", captureLog)

  await waitForApi(webhookBaseUrl, child, () => serverLogs, [404])

  const webhookListResponse = await fetch(`${webhookBaseUrl}/api/leads`)
  assert.equal(webhookListResponse.status, 404)
  const webhookListBody = await webhookListResponse.json()
  assert.equal(webhookListBody.success, false)
  assert.equal(webhookListBody.error, "Local lead storage is disabled")

  const webhookPostResponse = await postJson(`${webhookBaseUrl}/api/leads`, testLead)
  assert.equal(webhookPostResponse.status, 200)
  const webhookPostBody = await webhookPostResponse.json()
  assert.equal(webhookPostBody.success, true)
  assert.equal(webhookPostBody.data.reviewStatus, "pending_review")
  assert.match(webhookPostBody.data.leadReference, uuidPattern)

  assert.equal(webhookHarness.requests.length, 1)
  const webhookRequest = webhookHarness.requests[0]
  assert.equal(webhookRequest.method, "POST")
  assert.equal(webhookRequest.authorization, `Bearer ${webhookSecret}`)
  assert.equal(webhookRequest.contentType, "application/json")
  assert.equal(webhookRequest.body.event, "lead.captured")
  assert.equal(webhookRequest.body.lead.leadReference, webhookPostBody.data.leadReference)
  assert.equal(webhookRequest.body.lead.reviewStatus, webhookPostBody.data.reviewStatus)
  assert.equal(existsSync(defaultLeadsFile), false)
  assert.equal(existsSync(defaultNotificationsFile), false)

  await stopChild(child)
  child = undefined
  await stopServer(webhookServer)
  webhookServer = undefined
  serverLogs = ""

  const localPort = await reservePort()
  const localBaseUrl = `http://127.0.0.1:${localPort}`
  const localEnv = {
    ...process.env,
    NODE_ENV: "production",
    LEADS_STORAGE_MODE: "local",
    LEADS_DATA_DIR: dataDir,
    RESEND_API_KEY: "",
    LEADS_WEBHOOK_URL: "",
    LEADS_WEBHOOK_SECRET: "",
    LEAD_NOTIFICATION_EMAIL: "",
    NOTIFICATION_EMAIL: "",
  }

  child = spawn(process.execPath, [nextBin, "start", "-H", "127.0.0.1", "-p", String(localPort)], {
    cwd: root,
    env: localEnv,
    stdio: ["ignore", "pipe", "pipe"],
  })

  child.stdout.on("data", captureLog)
  child.stderr.on("data", captureLog)

  await waitForApi(localBaseUrl, child, () => serverLogs)

  const invalidEmailResponse = await postJson(`${localBaseUrl}/api/leads`, {
    ...testLead,
    email: "not-an-email",
  })
  assert.equal(invalidEmailResponse.status, 400)

  const invalidSourceResponse = await postJson(`${localBaseUrl}/api/leads`, {
    ...testLead,
    source: "untrusted-source",
  })
  assert.equal(invalidSourceResponse.status, 400)

  const acceptedResponse = await postJson(`${localBaseUrl}/api/leads`, testLead)
  assert.equal(acceptedResponse.status, 200)
  const acceptedBody = await acceptedResponse.json()
  assert.equal(acceptedBody.success, true)
  assert.equal(acceptedBody.data.reviewStatus, "pending_review")
  assert.match(acceptedBody.data.leadReference, uuidPattern)

  const listResponse = await fetch(`${localBaseUrl}/api/leads`)
  assert.equal(listResponse.status, 200)
  const listBody = await listResponse.json()
  assert.equal(listBody.success, true)
  assert.equal(listBody.data.length, 1)

  const storedLead = listBody.data[0]
  assert.equal(storedLead.leadReference, acceptedBody.data.leadReference)
  assert.equal(storedLead.reviewStatus, "pending_review")
  assert.equal(storedLead.analytics.leadCaptureTrigger, "email_quote_button")
  assert.equal(storedLead.quoteData.total, 1500)
  assert.equal("posthogDistinctId" in storedLead, false)

  const leadsFile = JSON.parse(await readFile(path.join(dataDir, "leads.json"), "utf8"))
  assert.equal(leadsFile.length, 1)
  assert.equal(leadsFile[0].leadReference, acceptedBody.data.leadReference)
  assert.equal(leadsFile[0].reviewStatus, "pending_review")

  const notifications = await waitForJson(path.join(dataDir, "notifications.json"))
  assert.equal(notifications.length, 1)
  assert.equal(notifications[0].lead.leadReference, acceptedBody.data.leadReference)
  assert.equal(notifications[0].lead.reviewStatus, "pending_review")
  assert.match(notifications[0].subject, /New QBCC Calculator Lead \[[0-9a-f-]+\]/)

  const persistedJson = JSON.stringify({ leadsFile, notifications })
  assert.equal(persistedJson.includes("posthogDistinctId"), false)

  result = {
    status: "pass",
    contract_assertions: 45,
    production_no_provider_get_status: failClosedListResponse.status,
    production_no_provider_post_status: failClosedPostResponse.status,
    production_no_provider_error: failClosedPostBody.error,
    production_no_provider_local_files_created: false,
    webhook_get_status: webhookListResponse.status,
    webhook_post_status: webhookPostResponse.status,
    webhook_requests: webhookHarness.requests.length,
    webhook_authorized: true,
    webhook_event: webhookRequest.body.event,
    webhook_reference_matches: true,
    webhook_review_status: webhookRequest.body.lead.reviewStatus,
    webhook_local_files_created: false,
    invalid_email_status: invalidEmailResponse.status,
    invalid_source_status: invalidSourceResponse.status,
    accepted_status: acceptedResponse.status,
    lead_reference_is_uuid_v4: true,
    review_status: acceptedBody.data.reviewStatus,
    api_records: listBody.data.length,
    lead_file_records: leadsFile.length,
    notification_records: notifications.length,
    external_email_configured: false,
    external_webhook_configured: false,
  }
} catch (error) {
  failure = error
} finally {
  await stopChild(child)
  await stopServer(webhookServer)
  await rm(dataDir, { recursive: true, force: true })
}

if (failure) {
  if (serverLogs) {
    process.stderr.write(serverLogs)
  }
  throw failure
}

assert.equal(existsSync(dataDir), false)
console.log(JSON.stringify({ ...result, temporary_data_removed: true }, null, 2))
