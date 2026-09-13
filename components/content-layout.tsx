import type { ReactNode } from "react"
import Link from "next/link"

import { ContentNav } from "@/components/content-nav"
import { RelayCta } from "@/components/relay-cta"

export function ContentLayout({
  currentPath,
  title,
  intro,
  children,
}: {
  currentPath: string
  title: string
  intro: string
  children: ReactNode
}) {
  return (
    <main className="min-h-screen bg-leva-grey-pale py-8 sm:py-12">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6">
        <ContentNav currentPath={currentPath} />

        <article className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 sm:p-10">
          <header>
            <h1 className="text-3xl font-bold tracking-tight text-leva-navy sm:text-4xl">{title}</h1>
            <p className="mt-4 text-base leading-7 text-zinc-700">{intro}</p>

          </header>

          <div className="prose prose-zinc mt-8 max-w-none prose-headings:text-leva-navy prose-a:text-leva-navy">
            {children}
          </div>

          <section className="mt-10">
            <Link href="/toolkit" className="underline">Builder tools and services</Link>
          </section>

          <section className="mt-10 rounded-xl bg-zinc-50 p-5">
            <h2 className="text-xl font-semibold text-leva-navy">Related resources</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:underline">
                  Use the QBCC insurance calculator
                </Link>
              </li>
              <li>
                <Link href="https://www.qbcc.qld.gov.au/home-owner-hub/queensland-home-warranty-scheme" target="_blank" rel="noreferrer" className="hover:underline">
                  Queensland Home Warranty Scheme (QBCC)
                </Link>
              </li>
              <li>
                <Link href="https://www.qbcc.qld.gov.au/running-your-business/home-warranty-insurance-obligations/calculating-premium" target="_blank" rel="noreferrer" className="hover:underline">
                  QBCC premium calculation guidance
                </Link>
              </li>
            </ul>
          </section>
        </article>
      </div>
    </main>
  )
}
