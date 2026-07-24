type JsonLd = Record<string, unknown> & {
  "@context": "https://schema.org"
  "@graph": Array<Record<string, unknown>>
}

type TendrankHomeMetadata = {
  title: string
  description: string
  canonicalUrl: string
  jsonLd: JsonLd
  sourceFile: string
}

function readInjectedMetadata(): TendrankHomeMetadata {
  const raw = process.env.TENDRANK_HOME_METADATA_JSON

  if (!raw) {
    throw new Error("TENDRANK_HOME_METADATA_JSON was not injected by next.config.js")
  }

  const value = JSON.parse(raw) as Partial<TendrankHomeMetadata>

  if (
    typeof value.title !== "string" ||
    typeof value.description !== "string" ||
    typeof value.canonicalUrl !== "string" ||
    typeof value.sourceFile !== "string" ||
    !value.jsonLd ||
    !Array.isArray(value.jsonLd["@graph"])
  ) {
    throw new Error("Injected Tendrank home metadata is invalid")
  }

  return value as TendrankHomeMetadata
}

export const tendrankHomeMetadata = readInjectedMetadata()
