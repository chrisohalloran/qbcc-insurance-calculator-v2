import { siteWideWebsiteSchema } from "@/lib/homepage-agent"

export default function SiteJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(siteWideWebsiteSchema) }}
    />
  )
}
