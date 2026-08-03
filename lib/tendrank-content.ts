import sanitizeHtml from "sanitize-html"

const TENDRANK_API_URL =
  process.env.TENDRANK_CONTENT_API_URL || "https://tendrank.com/api/v1"

// This token scopes public reads to the QBCC site. It is an identifier, not a
// credential; Tendrank intentionally exposes it in public article URLs.
const TENDRANK_CONTENT_TOKEN =
  process.env.TENDRANK_CONTENT_TOKEN || "9Mdu_Q9nZ71eOC9h3Z6rIQ"

const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const LIVE_ACTION_TYPES = new Set(["article", "new_article", "pillar_content"])
const RESERVED_SLUGS = new Set([
  "costs",
  "faq",
  "guide",
  "guides",
  "owner-builder",
  "toolkit",
  "who-needs-it",
])

export type TendrankPostSummary = {
  slug: string
  title: string
  meta_description: string | null
  action_type: string | null
  target_path: string | null
  updated_at: string
}

export type TendrankPost = TendrankPostSummary & {
  html_body: string
  brief: string | null
  json_ld: string | null
}

type TendrankIndex = {
  posts: TendrankPostSummary[]
}

function isSafeSlug(slug: string): boolean {
  return SAFE_SLUG.test(slug)
}

function isPostSummary(value: unknown): value is TendrankPostSummary {
  if (!value || typeof value !== "object") return false

  const post = value as Partial<TendrankPostSummary>

  return (
    typeof post.slug === "string" &&
    isSafeSlug(post.slug) &&
    typeof post.title === "string" &&
    typeof post.updated_at === "string"
  )
}

function isPost(value: unknown): value is TendrankPost {
  return (
    isPostSummary(value) &&
    typeof (value as Partial<TendrankPost>).html_body === "string"
  )
}

function isManagedLivePage(post: TendrankPostSummary): boolean {
  return (
    !RESERVED_SLUGS.has(post.slug) &&
    LIVE_ACTION_TYPES.has(post.action_type || "") &&
    post.target_path === `/${post.slug}`
  )
}

export async function getTendrankPosts(): Promise<TendrankPostSummary[]> {
  try {
    const response = await fetch(
      `${TENDRANK_API_URL}/blog/${encodeURIComponent(TENDRANK_CONTENT_TOKEN)}`,
      { next: { revalidate: 300 } },
    )

    if (!response.ok) return []

    const payload = (await response.json()) as Partial<TendrankIndex>
    return Array.isArray(payload.posts)
      ? payload.posts.filter(isPostSummary).filter(isManagedLivePage)
      : []
  } catch {
    // Existing site pages and sitemap generation must survive a Tendrank outage.
    return []
  }
}

export async function getTendrankPost(slug: string): Promise<TendrankPost | null> {
  if (!isSafeSlug(slug)) return null

  const response = await fetch(
    `${TENDRANK_API_URL}/blog/${encodeURIComponent(TENDRANK_CONTENT_TOKEN)}/${encodeURIComponent(slug)}`,
    // Keep rollback observable within Tendrank's verification window while
    // still sharing responses between ordinary article requests.
    { next: { revalidate: 5 } },
  )

  if (response.status === 404) return null
  if (!response.ok) throw new Error(`Tendrank content request failed (${response.status})`)

  const payload = (await response.json()) as unknown
  return isPost(payload) && isManagedLivePage(payload) ? payload : null
}

export function sanitizeTendrankHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
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
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
    ],
    allowedAttributes: { a: ["href"] },
    allowProtocolRelative: false,
    transformTags: {
      a: (_tagName, attributes): sanitizeHtml.Tag => {
        const href = attributes.href

        if (href?.startsWith("/") && !href.startsWith("//")) {
          return { tagName: "a", attribs: { href } }
        }

        return { tagName: "span", attribs: {} as sanitizeHtml.Attributes }
      },
    },
  })
}

export function safeJsonLd(json: string | null): string | null {
  if (!json) return null

  try {
    const parsed = JSON.parse(json)

    if (!parsed || (typeof parsed !== "object" && !Array.isArray(parsed))) {
      return null
    }

    return JSON.stringify(parsed).replace(/</g, "\\u003c")
  } catch {
    return null
  }
}
