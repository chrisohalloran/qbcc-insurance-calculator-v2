const fs = require("node:fs")
const path = require("node:path")

const EXPECTED_BINDING = Object.freeze({
  canonicalUrl: "https://www.qbccinsurancecalculator.com.au/",
  repository: "chrisohalloran/qbcc-insurance-calculator-v2",
  defaultBranch: "main",
  provider: "vercel",
  productionBranch: "main",
  workflowPath: ".github/workflows/ci.yml",
  canarySourcePath: "public/tendrank-deploy-canary.txt",
  canaryPublicUrl:
    "https://www.qbccinsurancecalculator.com.au/tendrank-deploy-canary.txt",
})

function assertObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`)
  }

  return value
}

function assertString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} must be a non-empty string`)
  }

  return value
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label} must be ${JSON.stringify(expected)}; received ${JSON.stringify(actual)}`)
  }
}

function readJson(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"))
  } catch (error) {
    throw new Error(`Unable to read ${label} at ${filePath}: ${error.message}`)
  }
}

function loadTendrankHomeMetadata(rootDir = process.cwd()) {
  const sitePath = path.join(rootDir, ".tendrank", "site.json")
  const contentPath = path.join(rootDir, ".tendrank", "content", "home.html")
  const site = assertObject(readJson(sitePath, "Tendrank site binding"), "Tendrank site binding")
  const deployment = assertObject(site.deployment, "Tendrank deployment binding")
  const canary = assertObject(deployment.canary, "Tendrank deployment canary")

  assertEqual(site.canonical_url, EXPECTED_BINDING.canonicalUrl, "site.canonical_url")
  assertEqual(site.repository, EXPECTED_BINDING.repository, "site.repository")
  assertEqual(site.default_branch, EXPECTED_BINDING.defaultBranch, "site.default_branch")
  assertEqual(deployment.provider, EXPECTED_BINDING.provider, "site.deployment.provider")
  assertEqual(
    deployment.production_branch,
    EXPECTED_BINDING.productionBranch,
    "site.deployment.production_branch",
  )
  assertEqual(
    deployment.production_url,
    EXPECTED_BINDING.canonicalUrl,
    "site.deployment.production_url",
  )
  assertEqual(
    deployment.workflow_path,
    EXPECTED_BINDING.workflowPath,
    "site.deployment.workflow_path",
  )
  assertEqual(
    canary.source_path,
    EXPECTED_BINDING.canarySourcePath,
    "site.deployment.canary.source_path",
  )
  assertEqual(
    canary.public_url,
    EXPECTED_BINDING.canaryPublicUrl,
    "site.deployment.canary.public_url",
  )

  const content = fs.readFileSync(contentPath, "utf8")
  const matches = [...content.matchAll(/<!--\s*tendrank:metadata\s*([\s\S]*?)-->/g)]
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one tendrank:metadata block in ${contentPath}; found ${matches.length}`)
  }

  let source
  try {
    source = assertObject(JSON.parse(matches[0][1]), "Tendrank home metadata")
  } catch (error) {
    throw new Error(`Invalid Tendrank home metadata in ${contentPath}: ${error.message}`)
  }

  const title = assertString(source.title, "metadata.title")
  const description = assertString(source.meta_description, "metadata.meta_description")
  const jsonLd = assertObject(source.json_ld, "metadata.json_ld")
  const graph = jsonLd["@graph"]

  assertEqual(source.source, "tendrank", "metadata.source")
  assertEqual(source.slug, "home", "metadata.slug")
  assertEqual(source.target_path, "/home", "metadata.target_path")
  assertEqual(
    source.site_domain,
    EXPECTED_BINDING.canonicalUrl.replace(/\/$/, ""),
    "metadata.site_domain",
  )
  assertEqual(jsonLd["@context"], "https://schema.org", "metadata.json_ld.@context")

  if (!Array.isArray(graph) || graph.length === 0) {
    throw new Error("metadata.json_ld.@graph must be a non-empty array")
  }

  if (title.length > 70) {
    throw new Error(`metadata.title must be at most 70 characters; received ${title.length}`)
  }

  if (description.length > 180) {
    throw new Error(
      `metadata.meta_description must be at most 180 characters; received ${description.length}`,
    )
  }

  return {
    title,
    description,
    canonicalUrl: EXPECTED_BINDING.canonicalUrl,
    jsonLd,
    sourceFile: path.relative(rootDir, contentPath),
    binding: EXPECTED_BINDING,
  }
}

module.exports = {
  EXPECTED_BINDING,
  loadTendrankHomeMetadata,
}
