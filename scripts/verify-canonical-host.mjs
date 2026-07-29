import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

const appRoot = path.resolve("app")
const apexUrl = /https:\/\/qbccinsurancecalculator\.com\.au/g
const canonicalOrigin = "https://www.qbccinsurancecalculator.com.au"

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await sourceFiles(entryPath)))
    } else if (/\.(?:js|jsx|ts|tsx)$/.test(entry.name)) {
      files.push(entryPath)
    }
  }

  return files
}

const files = await sourceFiles(appRoot)
const violations = []

for (const file of files) {
  const source = await readFile(file, "utf8")

  if (apexUrl.test(source)) {
    violations.push(path.relative(process.cwd(), file))
  }

  apexUrl.lastIndex = 0
}

if (violations.length > 0) {
  console.error(
    `Non-canonical apex URLs found. Use ${canonicalOrigin} in: ${violations.join(", ")}`,
  )
  process.exit(1)
}

const requiredBindings = new Map([
  ["app/layout.tsx", `${canonicalOrigin}/`],
  ["app/metadata.ts", canonicalOrigin],
  ["app/robots.ts", `${canonicalOrigin}/sitemap.xml`],
  ["app/sitemap.ts", canonicalOrigin],
])

for (const [file, expected] of requiredBindings) {
  const source = await readFile(file, "utf8")

  if (!source.includes(expected)) {
    console.error(`${file} must bind its public SEO URL to ${expected}`)
    process.exit(1)
  }
}

console.log(`Canonical host verified: ${canonicalOrigin}`)
