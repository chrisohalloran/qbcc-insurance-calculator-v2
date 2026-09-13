import Link from "next/link"

export type ContentPageLink = {
  href: string
  title: string
}

export const contentPages: ContentPageLink[] = [
  { href: "/premium-table", title: "2026 premium table and examples" },
  { href: "/faq", title: "Common insurance questions" },
  { href: "/guide", title: "Complete 2026 guide" },
  { href: "/who-needs-it", title: "Who needs QBCC insurance" },
  { href: "/costs", title: "QBCC insurance costs" },
  { href: "/owner-builder", title: "Owner builder requirements" },
]

export function ContentNav({ currentPath }: { currentPath: string }) {
  return (
    <nav aria-label="QBCC insurance guides" className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Browse guides</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {contentPages.map((page) => {
          const isActive = page.href === currentPath
          return (
            <li key={page.href}>
              <Link
                href={page.href}
                className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-leva-navy text-white"
                    : "bg-zinc-50 text-zinc-700 hover:bg-leva-orange-pale hover:text-leva-navy"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {page.title}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
