import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { resolve } from "node:path"

const require = createRequire(import.meta.url)
const { loadTendrankHomeMetadata } = require("./tendrank-home-metadata.cjs")

const rootDir = resolve(import.meta.dirname, "..")
const result = loadTendrankHomeMetadata(rootDir)
const content = readFileSync(resolve(rootDir, result.sourceFile))

process.stdout.write(
  `${JSON.stringify(
    {
      status: "ok",
      title: result.title,
      description: result.description,
      canonical_url: result.canonicalUrl,
      repository: result.binding.repository,
      production_branch: result.binding.productionBranch,
      workflow_path: result.binding.workflowPath,
      canary_public_url: result.binding.canaryPublicUrl,
      source_file: result.sourceFile,
      source_sha256: createHash("sha256").update(content).digest("hex"),
      json_ld_nodes: result.jsonLd["@graph"].length,
    },
    null,
    2,
  )}\n`,
)
