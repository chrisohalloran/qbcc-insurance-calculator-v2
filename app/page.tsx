"use client"

import Script from "next/script"
import Link from "next/link"
import { CalculatorForm } from "@/components/calculator-form"
import { ThemeToggle } from "@/components/theme-toggle"
import { Text } from "@/components/catalyst/text"
import { RateNotificationBanner } from "@/components/rate-notification-banner"

export default function Page() {
  // Schema.org JSON-LD structured data
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "QBCC Home Warranty Insurance Calculator",
    applicationCategory: "FinanceApplication",
    operatingSystem: "All",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "AUD",
    },
    description:
      "Calculate QBCC home warranty insurance premiums for new construction and renovations based on current QBCC premium rates (effective 1 July 2020, verified current as of March 2026).",
    featureList: [
      "Calculate premiums for new construction",
      "Calculate premiums for renovations and additions",
      "Support for multiple dwelling calculations",
      "Based on current QBCC premium rates (effective 1 July 2020, verified March 2026)",
    ],
    keywords:
      "QBCC, home warranty, insurance calculator, Queensland Building and Construction Commission, premium calculator",
    audience: {
      "@type": "Audience",
      audienceType: "Builders, Homeowners, Construction Industry",
    },
  }

  return (
    <>
      <Script
        id="schema-org-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <main className="min-h-screen bg-leva-grey-pale dark:bg-zinc-950">
        {/* Header */}
        <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
           <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              {/* Logo */}
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                 <span className="truncate text-lg font-bold text-leva-navy dark:text-white sm:text-xl">
                    <span className="sm:hidden">QBCC Calculator</span>
                    <span className="hidden sm:inline">QBCC Home Warranty Insurance Calculator</span>
                 </span>
              </div>
              
              <div className="flex items-center gap-4 sm:gap-6">
                 <nav className="hidden sm:flex items-center gap-6">
                    <Link href="/guides" className="text-sm font-medium text-gray-600 hover:text-leva-navy dark:text-gray-400 dark:hover:text-white transition-colors">Guides</Link>
                    <Link href="/faq" className="text-sm font-medium text-gray-600 hover:text-leva-navy dark:text-gray-400 dark:hover:text-white transition-colors">FAQ</Link>
                 </nav>
                 <div className="pl-4 border-l border-zinc-200 dark:border-zinc-800">
                    <ThemeToggle />
                 </div>
              </div>
           </div>
        </header>

        {/* Rate Notification Banner */}
        <RateNotificationBanner />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
           <div className="max-w-5xl mx-auto">
              <CalculatorForm />
              
              {/* SEO Content Section */}
              <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
                  <div>
                      <h2 className="text-lg font-bold text-leva-navy dark:text-white mb-4">Common Estimates</h2>
                      <ul className="space-y-2 text-sm text-gray-600 dark:text-zinc-300">
                          <li><Link href="/estimate/new-construction/300000" className="hover:text-leva-orange hover:underline dark:hover:text-leva-orange-light">Insurance for $300,000 New Build</Link></li>
                          <li><Link href="/estimate/new-construction/450000" className="hover:text-leva-orange hover:underline dark:hover:text-leva-orange-light">Insurance for $450,000 New Build</Link></li>
                          <li><Link href="/estimate/new-construction/600000" className="hover:text-leva-orange hover:underline dark:hover:text-leva-orange-light">Insurance for $600,000 New Build</Link></li>
                          <li><Link href="/estimate/renovation/50000" className="hover:text-leva-orange hover:underline dark:hover:text-leva-orange-light">Premium for $50,000 Renovation</Link></li>
                          <li><Link href="/estimate/renovation/150000" className="hover:text-leva-orange hover:underline dark:hover:text-leva-orange-light">Premium for $150,000 Renovation</Link></li>
                          <li><Link href="/estimate/renovation/250000" className="hover:text-leva-orange hover:underline dark:hover:text-leva-orange-light">Premium for $250,000 Renovation</Link></li>
                      </ul>
                  </div>
                  <div>
                      <h2 className="text-lg font-bold text-leva-navy dark:text-white mb-4">About QBCC Insurance</h2>
                      <p className="text-sm text-gray-600 leading-relaxed mb-4 dark:text-zinc-300">
                          Home warranty insurance is mandatory for residential construction work in Queensland valued at over $3,300. The premium is paid by the contractor to the Queensland Building and Construction Commission (QBCC).
                      </p>
                      <p className="text-sm text-gray-600 leading-relaxed dark:text-zinc-300">
                          The <strong>QLeave Levy</strong> (0.575%) applies to all building and construction work in Queensland where the total cost of work is $150,000 (excl. GST) or more.
                      </p>
                  </div>
              </div>
           </div>
        </div>

        <footer className="py-12 text-center border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
           <div className="container mx-auto px-4">
             <Text className="text-sm text-gray-500">
                © {new Date().getFullYear()} QBCC Home Warranty Insurance Calculator
             </Text>
             <div className="mt-2">
                <Text className="text-sm text-gray-500 inline">Powered by </Text>
                <a href="https://levasolutions.com.au" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-leva-orange hover:underline">
                   Leva Solutions
                </a>
             </div>
             <Text className="text-xs text-gray-400 mt-4">
                Not affiliated with the Queensland Building and Construction Commission.
             </Text>
             <Text className="text-xs text-gray-400 mt-2">
                Premium rates effective 1 July 2020 — verified current as of March 2026.
             </Text>
           </div>
        </footer>
      </main>
    </>
  )
}
