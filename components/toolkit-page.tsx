"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"
import { usePostHog } from "posthog-js/react"
import { ArrowRightIcon, CalculatorIcon, TableCellsIcon } from "@heroicons/react/24/outline"
import { ThemeToggle } from "@/components/theme-toggle"
import { captureEvent } from "@/lib/analytics"
import { calculateQuote, currency } from "@/lib/quote"

const example = calculateQuote({ workType: "new-construction", insurableValue: 450000, units: 1 })
const rows = [150000, 300000, 450000].map(value => calculateQuote({ workType: "new-construction", insurableValue: value, units: 1 }))
const tools = [
  { id: "insurance_calculator", name: "QBCC insurance calculator", href: "/" },
  { id: "premium_table", name: "QBCC premium table", href: "/premium-table" },
]

export default function ToolkitPage() {
  const posthog = usePostHog()
  const cards = useRef<HTMLDivElement>(null)
  const seen = useRef(new Set<string>())
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const id = (entry.target as HTMLElement).dataset.toolId
        if (entry.isIntersecting && id && !seen.current.has(id)) {
          seen.current.add(id)
          captureEvent(posthog, "toolkit_tool_viewed", { tool_id: id, placement: "toolkit" })
        }
      }
    }, { threshold: 0.5 })
    cards.current?.querySelectorAll("[data-tool-id]").forEach(card => observer.observe(card))
    return () => observer.disconnect()
  }, [posthog])
  const click = (id: string) => captureEvent(posthog, "toolkit_tool_clicked", { tool_id: id, placement: "toolkit" })

  return (
    <main className="min-h-screen bg-leva-grey-pale text-leva-navy dark:bg-zinc-950 dark:text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "CollectionPage", name: "Queensland builder tools",
        url: "https://www.qbccinsurancecalculator.com.au/toolkit",
        mainEntity: { "@type": "ItemList", itemListElement: tools.map((tool, index) => ({ "@type": "ListItem", position: index + 1, name: tool.name, url: `https://www.qbccinsurancecalculator.com.au${tool.href}` })) },
      }) }} />
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href="/" className="text-lg font-bold">QBCC Calculator</Link>
          <div className="flex items-center gap-5"><Link href="/guides" className="text-sm hover:underline">Guides</Link><ThemeToggle /></div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-20">
        <p className="mb-4 text-sm font-semibold text-zinc-600 dark:text-zinc-400">Queensland builder tools</p>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">Know the costs.<br />Get on with the job.</h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">Estimate your home warranty premium, check the levy and keep a quote ready to share.</p>
        <div ref={cards} className="mt-10 grid gap-6 lg:grid-cols-5">
          <Link href="/" data-tool-id="insurance_calculator" onClick={() => click("insurance_calculator")}
            className="group flex flex-col rounded-3xl bg-leva-navy p-6 text-white transition-shadow hover:shadow-xl focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-leva-orange sm:p-9 lg:col-span-3">
            <div className="flex items-center justify-between gap-4"><CalculatorIcon className="size-7 text-orange-200" /><span className="rounded-full border border-white/25 px-3 py-1 text-xs font-medium">Free · No sign-up</span></div>
            <h2 className="mt-7 text-3xl font-semibold tracking-tight">Put a number on your next job.</h2>
            <p className="mt-3 max-w-md leading-7 text-slate-200">New build or renovation. Get your QBCC and QLeave estimate, then copy, compare or print it.</p>
            <div className="my-8 rounded-xl bg-white p-5 text-leva-navy shadow-lg sm:p-6">
              <div className="flex flex-wrap justify-between gap-2 border-b border-zinc-200 pb-4 text-sm"><span>New home · One dwelling</span><span className="font-mono">$450,000 incl. GST</span></div>
              <dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-3"><dt>QBCC premium</dt><dd className="font-mono">{currency(example.premium)}</dd></div><div className="flex justify-between gap-3"><dt>QLeave estimate</dt><dd className="font-mono">{currency(example.qleave)}</dd></div></dl>
              <div className="mt-5 flex flex-wrap items-baseline justify-between gap-2 border-t border-zinc-200 pt-4"><span className="text-sm font-medium">Estimated total</span><span className="font-mono text-3xl font-semibold tracking-tight">{currency(example.total)}</span></div>
              <p className="mt-3 text-xs leading-5 text-zinc-500">Example only. QLeave assumes the same value excluding GST.</p>
            </div>
            <span className="mt-auto flex items-center justify-between border-t border-white/20 pt-5 text-base font-semibold">Calculate my project <ArrowRightIcon className="size-5 transition-transform motion-safe:group-hover:translate-x-1" /></span>
          </Link>
          <Link href="/premium-table" data-tool-id="premium_table" onClick={() => click("premium_table")}
            className="group flex flex-col rounded-3xl border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-xl focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-leva-orange dark:border-zinc-700 dark:bg-zinc-900 sm:p-9 lg:col-span-2">
            <div className="flex items-center justify-between gap-4"><TableCellsIcon className="size-7 text-leva-orange" /><span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Quick reference</span></div>
            <h2 className="mt-7 text-3xl font-semibold tracking-tight">Check the premium before you quote.</h2>
            <p className="mt-3 leading-7 text-zinc-600 dark:text-zinc-300">Compare new-build and renovation premiums across 24 project values. Open any example to adjust it.</p>
            <div className="my-8"><p className="mb-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">New home · One dwelling</p><dl>{rows.map(row => <div key={row.insurableValue} className="flex justify-between gap-3 border-t border-zinc-200 py-4 font-mono text-sm dark:border-zinc-700"><dt>{currency(row.insurableValue)}</dt><dd className="font-semibold">{currency(row.premium)}</dd></div>)}</dl><p className="text-xs text-zinc-500 dark:text-zinc-400">Project value and premium include GST.</p></div>
            <span className="mt-auto flex items-center justify-between border-t border-zinc-200 pt-5 text-base font-semibold dark:border-zinc-700">Explore premium tables <ArrowRightIcon className="size-5 transition-transform motion-safe:group-hover:translate-x-1" /></span>
          </Link>
        </div>
        <p className="mt-7 text-sm text-zinc-500 dark:text-zinc-400">Independent estimates from Leva Solutions. Not affiliated with QBCC.</p>
      </div>
    </main>
  )
}
