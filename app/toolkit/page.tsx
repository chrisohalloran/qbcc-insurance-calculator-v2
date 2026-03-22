"use client"

import Script from "next/script"
import Link from "next/link"
import { useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Text } from "@/components/catalyst/text"
import { Heading } from "@/components/catalyst/heading"
import { Button } from "@/components/catalyst/button"
import { Field, Label } from "@/components/catalyst/fieldset"
import { Input } from "@/components/catalyst/input"
import { 
  WrenchScrewdriverIcon, 
  ShieldCheckIcon, 
  BuildingOffice2Icon, 
  ScaleIcon,
  EnvelopeIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline"

export default function ToolkitPage() {
  const [email, setEmail] = useState("")
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || isSubscribing) return
    
    setIsSubscribing(true)
    
    try {
      // Newsletter subscription API call would go here
      // For now, just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000))
      setIsSubscribed(true)
      setEmail("")
    } catch (error) {
      console.error("Newsletter subscription failed:", error)
    } finally {
      setIsSubscribing(false)
    }
  }

  // Schema.org JSON-LD structured data
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "QLD Builder Toolkit - Free Tools for Queensland Builders",
    description: "Free AI-powered tools for QLD builders including compliance checkers, site management tools, business automation, and dispute resolution.",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "/"
        },
        {
          "@type": "ListItem", 
          position: 2,
          name: "Toolkit",
          item: "/toolkit"
        }
      ]
    },
    mainEntity: {
      "@type": "ItemList",
      name: "QLD Builder Tools",
      itemListElement: [
        {
          "@type": "SoftwareApplication",
          name: "QBCC Insurance Calculator",
          applicationCategory: "FinanceApplication",
          description: "Calculate QBCC home warranty insurance premiums"
        },
        {
          "@type": "SoftwareApplication", 
          name: "SiteDiary",
          applicationCategory: "ProductivityApplication",
          description: "Digital site diary for construction projects"
        }
      ]
    }
  }

  return (
    <>
      <Script
        id="toolkit-schema-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <main className="min-h-screen bg-leva-grey-pale dark:bg-zinc-950">
        {/* Header */}
        <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/" className="text-xl font-bold text-leva-navy dark:text-white hover:text-leva-orange transition-colors">
                QBCC Calculator
              </Link>
            </div>
            
            <div className="flex items-center gap-4 sm:gap-6">
              <nav className="hidden sm:flex items-center gap-6">
                <Link href="/" className="text-sm font-medium text-gray-600 hover:text-leva-navy dark:text-gray-400 dark:hover:text-white transition-colors">Calculator</Link>
                <Link href="/guides" className="text-sm font-medium text-gray-600 hover:text-leva-navy dark:text-gray-400 dark:hover:text-white transition-colors">Guides</Link>
                <Link href="/faq" className="text-sm font-medium text-gray-600 hover:text-leva-navy dark:text-gray-400 dark:hover:text-white transition-colors">FAQ</Link>
              </nav>
              <div className="pl-4 border-l border-zinc-200 dark:border-zinc-800">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-16 sm:py-24 bg-gradient-to-br from-leva-navy to-blue-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <Heading level={1} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                Free Tools for QLD Builders
              </Heading>
              <Text className="text-xl sm:text-2xl text-blue-100 mb-4">
                Built by Builders, Powered by AI
              </Text>
              <Text className="text-lg text-blue-200 max-w-2xl mx-auto">
                Everything you need to run a compliant, efficient building business in Queensland. 
                From QBCC compliance to AI-powered back-office automation.
              </Text>
            </div>
          </div>
        </section>

        {/* Section 1: Compliance & Insurance */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <ShieldCheckIcon className="h-8 w-8 text-leva-orange" />
                <Heading level={2} className="text-3xl font-bold text-leva-navy dark:text-white">
                  Compliance & Insurance
                </Heading>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-leva-navy dark:text-white">QBCC Insurance Calculator</h3>
                    <CheckCircleIcon className="h-6 w-6 text-green-500" />
                  </div>
                  <Text className="text-gray-600 dark:text-gray-300 mb-4">
                    Calculate home warranty insurance premiums instantly. Based on official QBCC 2020 tables.
                  </Text>
                  <Link href="/">
                    <Button className="w-full bg-leva-navy hover:bg-leva-orange transition-colors">
                      Use Calculator
                      <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm opacity-60">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-leva-navy dark:text-white">QBCC Licence Checker</h3>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                      Coming Soon
                    </span>
                  </div>
                  <Text className="text-gray-600 dark:text-gray-300 mb-4">
                    Verify QBCC license status and check contractor credentials before engaging.
                  </Text>
                  <Button disabled className="w-full bg-gray-300 text-gray-500 cursor-not-allowed">
                    Coming Soon
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: On-Site Tools */}
        <section className="py-16 bg-gray-50 dark:bg-zinc-900/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <WrenchScrewdriverIcon className="h-8 w-8 text-leva-orange" />
                <Heading level={2} className="text-3xl font-bold text-leva-navy dark:text-white">
                  On-Site Tools
                </Heading>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <h3 className="text-lg font-semibold text-leva-navy dark:text-white mb-2">SiteDiary</h3>
                  <Text className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                    Digital site diary with photo logging and weather tracking
                  </Text>
                  <a href="https://sitediary.grapl.ai" target="_blank" rel="noopener noreferrer">
                    <Button className="w-full bg-leva-orange hover:bg-leva-navy transition-colors text-sm">
                      Try Free
                      <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-2" />
                    </Button>
                  </a>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <h3 className="text-lg font-semibold text-leva-navy dark:text-white mb-2">DefectTrack</h3>
                  <Text className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                    Track and manage defects with photo evidence and follow-up
                  </Text>
                  <a href="https://defecttrack.grapl.ai" target="_blank" rel="noopener noreferrer">
                    <Button className="w-full bg-leva-orange hover:bg-leva-navy transition-colors text-sm">
                      Try Free
                      <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-2" />
                    </Button>
                  </a>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <h3 className="text-lg font-semibold text-leva-navy dark:text-white mb-2">SnapPunch</h3>
                  <Text className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                    Quick photo-based punch lists for handovers and inspections
                  </Text>
                  <a href="https://snappunch.grapl.ai" target="_blank" rel="noopener noreferrer">
                    <Button className="w-full bg-leva-orange hover:bg-leva-navy transition-colors text-sm">
                      Try Free
                      <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-2" />
                    </Button>
                  </a>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <h3 className="text-lg font-semibold text-leva-navy dark:text-white mb-2">SiteSnap</h3>
                  <Text className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                    Progress photos with GPS location and automatic organization
                  </Text>
                  <a href="https://sitesnap.grapl.ai" target="_blank" rel="noopener noreferrer">
                    <Button className="w-full bg-leva-orange hover:bg-leva-navy transition-colors text-sm">
                      Try Free
                      <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-2" />
                    </Button>
                  </a>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm md:col-span-2 lg:col-span-1">
                  <h3 className="text-lg font-semibold text-leva-navy dark:text-white mb-2">SafeTalk</h3>
                  <Text className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                    Safety meeting templates and WHS incident reporting
                  </Text>
                  <a href="https://safetalk.grapl.ai" target="_blank" rel="noopener noreferrer">
                    <Button className="w-full bg-leva-orange hover:bg-leva-navy transition-colors text-sm">
                      Try Free
                      <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-2" />
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Business Tools */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <BuildingOffice2Icon className="h-8 w-8 text-leva-orange" />
                <Heading level={2} className="text-3xl font-bold text-leva-navy dark:text-white">
                  Business Tools
                </Heading>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <h3 className="text-lg font-semibold text-leva-navy dark:text-white mb-2">QuoteFollow</h3>
                  <Text className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                    Automated quote follow-up system that converts more leads
                  </Text>
                  <a href="https://quotefollow.grapl.ai" target="_blank" rel="noopener noreferrer">
                    <Button className="w-full bg-leva-orange hover:bg-leva-navy transition-colors text-sm">
                      Try Free
                      <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-2" />
                    </Button>
                  </a>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <h3 className="text-lg font-semibold text-leva-navy dark:text-white mb-2">ScopeMate</h3>
                  <Text className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                    AI-powered scope of work generator for accurate quotes
                  </Text>
                  <a href="https://scopemate.grapl.ai" target="_blank" rel="noopener noreferrer">
                    <Button className="w-full bg-leva-orange hover:bg-leva-navy transition-colors text-sm">
                      Try Free
                      <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-2" />
                    </Button>
                  </a>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <h3 className="text-lg font-semibold text-leva-navy dark:text-white mb-2">TextTime</h3>
                  <Text className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                    Smart SMS automation for client updates and reminders
                  </Text>
                  <a href="https://texttime.grapl.ai" target="_blank" rel="noopener noreferrer">
                    <Button className="w-full bg-leva-orange hover:bg-leva-navy transition-colors text-sm">
                      Try Free
                      <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-2" />
                    </Button>
                  </a>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <h3 className="text-lg font-semibold text-leva-navy dark:text-white mb-2">Leva Relay</h3>
                  <Text className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                    AI phone assistant that handles calls when you're on site
                  </Text>
                  <a href="https://relay.grapl.ai" target="_blank" rel="noopener noreferrer">
                    <Button className="w-full bg-leva-orange hover:bg-leva-navy transition-colors text-sm">
                      Try Free
                      <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-2" />
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Disputes & Claims */}
        <section className="py-16 bg-gray-50 dark:bg-zinc-900/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <ScaleIcon className="h-8 w-8 text-leva-orange" />
                <Heading level={2} className="text-3xl font-bold text-leva-navy dark:text-white">
                  Disputes & Claims
                </Heading>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <h3 className="text-xl font-semibold text-leva-navy dark:text-white mb-2">ClaimStack</h3>
                  <Text className="text-gray-600 dark:text-gray-300 mb-4">
                    Document and organize evidence for insurance claims and disputes
                  </Text>
                  <a href="https://claimstack.grapl.ai" target="_blank" rel="noopener noreferrer">
                    <Button className="w-full bg-leva-orange hover:bg-leva-navy transition-colors">
                      Try Free
                      <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-2" />
                    </Button>
                  </a>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <h3 className="text-xl font-semibold text-leva-navy dark:text-white mb-2">Expert Witness AI</h3>
                  <Text className="text-gray-600 dark:text-gray-300 mb-4">
                    AI-powered construction expert analysis for legal proceedings
                  </Text>
                  <a href="https://expertwitness.grapl.ai" target="_blank" rel="noopener noreferrer">
                    <Button className="w-full bg-leva-orange hover:bg-leva-navy transition-colors">
                      Try Free
                      <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-2" />
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Email Newsletter Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <EnvelopeIcon className="h-12 w-12 text-leva-orange mx-auto mb-4" />
                <Heading level={3} className="text-2xl font-bold text-leva-navy dark:text-white mb-4">
                  Get QLD Builder Tool Updates
                </Heading>
                <Text className="text-gray-600 dark:text-gray-300 mb-6">
                  Be the first to know about new tools, QBCC rate changes, and industry updates.
                </Text>
                
                {isSubscribed ? (
                  <div className="flex items-center justify-center gap-3 text-green-600">
                    <CheckCircleIcon className="h-6 w-6" />
                    <Text className="font-medium">Thanks! You're subscribed to updates.</Text>
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <Field>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full"
                        />
                      </Field>
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isSubscribing || !email}
                      className="bg-leva-orange hover:bg-leva-navy transition-colors whitespace-nowrap"
                    >
                      {isSubscribing ? "Subscribing..." : "Subscribe"}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-16 bg-gradient-to-br from-leva-navy to-blue-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <Heading level={2} className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Want AI to run your back-office?
              </Heading>
              <Text className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Let AI handle quotes, follow-ups, scheduling, and admin while you focus on building. 
                Book a free consultation to see how much time you could save.
              </Text>
              <a 
                href="https://levasolutions.com.au/consulting" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button size="lg" className="bg-leva-orange hover:bg-white hover:text-leva-navy text-lg px-8 py-3 transition-all duration-200">
                  Book Free Consultation
                  <ArrowTopRightOnSquareIcon className="h-5 w-5 ml-2" />
                </Button>
              </a>
            </div>
          </div>
        </section>

        <footer className="py-12 text-center border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="container mx-auto px-4">
            <Text className="text-sm text-gray-500">
              © {new Date().getFullYear()} QLD Builder Toolkit
            </Text>
            <div className="mt-2">
              <Text className="text-sm text-gray-500 inline">Powered by </Text>
              <a href="https://levasolutions.com.au" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-leva-orange hover:underline">
                Leva Solutions
              </a>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}