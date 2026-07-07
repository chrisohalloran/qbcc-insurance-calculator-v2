import type { Metadata } from "next"
import Script from "next/script"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ArrowLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Frequently Asked Questions | QBCC Calculator",
  description: "Find answers to common questions about QBCC home warranty insurance and our calculator.",
  keywords: ["QBCC insurance", "home warranty", "Queensland building insurance", "QBCC FAQ"],
}

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is QBCC Home Warranty Insurance?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "QBCC Home Warranty Insurance provides protection for homeowners against defective or incomplete building work. It covers non-completion of building work, defective building work, and subsidence or settlement. This insurance is mandatory for most residential building work in Queensland valued over $3,300.",
      },
    },
    {
      "@type": "Question",
      name: "When is QBCC insurance required?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "QBCC Home Warranty Insurance is required for most residential building work in Queensland valued at $3,300 or more (including labour and materials). This includes new home construction; renovations, alterations, and additions; repairs, restoration, and improvements; and swimming pool construction.",
      },
    },
    {
      "@type": "Question",
      name: "How accurate is this calculator?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "This calculator uses the official QBCC premium tables (effective 1 July 2020, verified current as of March 2026) to calculate insurance premiums. While we strive for accuracy, this tool is provided for informational purposes only. For the most accurate calculations, consult the official QBCC premium table, contact QBCC directly for official quotes, or speak with your builder or contractor. Always verify the final premium amount with QBCC before making financial decisions.",
      },
    },
    {
      "@type": "Question",
      name: "What's the difference between new construction and renovation?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "In the context of QBCC insurance premiums, the distinction between new construction and renovation affects how your premium is calculated. New construction means building a completely new structure from the ground up, such as a new house, duplex, or unit. Renovation means work on an existing structure, including alterations, additions, improvements, or repairs.",
      },
    },
    {
      "@type": "Question",
      name: "Who pays for QBCC insurance?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Typically, the licensed contractor (builder) is responsible for taking out QBCC Home Warranty Insurance and paying the premium. However, this cost is usually passed on to the homeowner as part of the total project cost. The premium should be clearly itemised in your building contract, the builder must provide you with a copy of the insurance certificate, and if you are an owner-builder you will need to take out insurance if you sell the property within 6 years of completion.",
      },
    },
    {
      "@type": "Question",
      name: "What does QBCC insurance cover?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "QBCC Home Warranty Insurance covers non-completion (if your builder fails to complete the work due to insolvency, death, or disappearance), defective work (structural and non-structural defects discovered within the warranty period), and subsidence or settlement (foundation or ground movement affecting the building). Non-completion cover is up to 20% of the contract price or $200,000, whichever is less. Structural defects are covered for 6 years and 6 months from the contract date or when the premium is paid, and non-structural defects for 12 months after practical completion.",
      },
    },
    {
      "@type": "Question",
      name: "How do I make a claim on QBCC insurance?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "To make a claim, first contact your builder to try to resolve the issue directly. If that fails, submit a complaint to QBCC, complete the appropriate claim form, and provide supporting documentation such as your contract, payment records, photos of defects, and relevant correspondence. A claim fee applies (and may be refunded if your claim is successful). Non-completion claims must be lodged within 3 months of the contract being terminated, and defect claims must be lodged within the warranty period (6 years and 6 months for structural defects, 12 months for non-structural defects).",
      },
    },
  ],
}

export default function FAQPage() {
  return (
    <>
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="container mx-auto py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Calculator
            </Button>
          </Link>
        </div>

        <h1 className="text-3xl font-bold tracking-tight mb-2">Frequently Asked Questions</h1>
        <p className="text-muted-foreground mb-8">
          Find answers to common questions about QBCC home warranty insurance and our calculator.
        </p>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>What is QBCC Home Warranty Insurance?</AccordionTrigger>
            <AccordionContent>
              <p className="mb-4">
                QBCC Home Warranty Insurance provides protection for homeowners against defective or incomplete building
                work. It covers:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Non-completion of building work</li>
                <li>Defective building work</li>
                <li>Subsidence or settlement</li>
              </ul>
              <p>This insurance is mandatory for most residential building work in Queensland valued over $3,300.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger>When is QBCC insurance required?</AccordionTrigger>
            <AccordionContent>
              <p className="mb-4">
                QBCC Home Warranty Insurance is required for most residential building work in Queensland valued at
                $3,300 or more (including labor and materials).
              </p>
              <p className="mb-4">This includes:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>New home construction</li>
                <li>Renovations, alterations, and additions</li>
                <li>Repairs, restoration, and improvements</li>
                <li>Swimming pool construction</li>
              </ul>
              <p>
                For more detailed information, please refer to our{" "}
                <Link href="/guides/when-is-insurance-required" className="text-primary underline">
                  guide on when insurance is required
                </Link>
                .
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger>How accurate is this calculator?</AccordionTrigger>
            <AccordionContent>
              <p className="mb-4">
                This calculator uses the official QBCC premium tables (effective 1 July 2020, verified current as of March 2026) to calculate insurance
                premiums. While we strive for accuracy, this tool is provided for informational purposes only.
              </p>
              <p className="mb-4">For the most accurate and up-to-date premium calculations, we recommend:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>
                  Consulting the{" "}
                  <a
                    href="https://www.qbcc.qld.gov.au/sites/default/files/Insurance_Premium_Table.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    official QBCC premium table
                  </a>
                </li>
                <li>Contacting QBCC directly for official quotes</li>
                <li>Consulting with your builder or contractor</li>
              </ul>
              <p>Always verify the final premium amount with QBCC before making financial decisions.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger>What's the difference between new construction and renovation?</AccordionTrigger>
            <AccordionContent>
              <p className="mb-4">
                In the context of QBCC insurance premiums, the distinction between new construction and renovation
                affects how your premium is calculated:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>
                  <strong>New Construction:</strong> Building a completely new structure from the ground up, such as a
                  new house, duplex, or unit.
                </li>
                <li>
                  <strong>Renovation:</strong> Work on an existing structure, including alterations, additions,
                  improvements, or repairs.
                </li>
              </ul>
              <p>
                For more information, see our{" "}
                <Link href="/guides/new-construction-vs-renovation" className="text-primary underline">
                  guide on new construction vs. renovation
                </Link>
                .
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger>Who pays for QBCC insurance?</AccordionTrigger>
            <AccordionContent>
              <p className="mb-4">
                Typically, the licensed contractor (builder) is responsible for taking out QBCC Home Warranty Insurance
                and paying the premium. However, this cost is usually passed on to the homeowner as part of the total
                project cost.
              </p>
              <p className="mb-4">Important points to note:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>The insurance premium should be clearly itemized in your building contract</li>
                <li>The builder must provide you with a copy of the insurance certificate</li>
                <li>
                  If you're an owner-builder, you'll need to take out insurance if you sell the property within 6 years
                  of completion
                </li>
              </ul>
              <p>Always verify that your builder has obtained the necessary insurance before work begins.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6">
            <AccordionTrigger>What does QBCC insurance cover?</AccordionTrigger>
            <AccordionContent>
              <p className="mb-4">QBCC Home Warranty Insurance provides coverage for:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>
                  <strong>Non-completion:</strong> If your builder fails to complete the work (e.g., due to insolvency,
                  death, or disappearance)
                </li>
                <li>
                  <strong>Defective work:</strong> Structural and non-structural defects discovered within the warranty
                  period
                </li>
                <li>
                  <strong>Subsidence or settlement:</strong> Issues with the foundation or ground movement affecting the
                  building
                </li>
              </ul>
              <p className="mb-4">Coverage limits and periods:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>
                  <strong>Non-completion:</strong> Up to 20% of the contract price or $200,000, whichever is less
                </li>
                <li>
                  <strong>Structural defects:</strong> Coverage for 6 years and 6 months from contract date or when
                  premium is paid
                </li>
                <li>
                  <strong>Non-structural defects:</strong> Coverage for 12 months after practical completion
                </li>
              </ul>
              <p>
                For detailed information, refer to the{" "}
                <a
                  href="https://www.qbcc.qld.gov.au/homeowners/home-warranty-insurance"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  QBCC website
                </a>
                .
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-7">
            <AccordionTrigger>How do I make a claim on QBCC insurance?</AccordionTrigger>
            <AccordionContent>
              <p className="mb-4">To make a claim on your QBCC Home Warranty Insurance:</p>
              <ol className="list-decimal pl-6 mb-4 space-y-2">
                <li>
                  <strong>Contact your builder first:</strong> Try to resolve the issue directly with your builder
                  before making a claim
                </li>
                <li>
                  <strong>Submit a complaint to QBCC:</strong> If you can't resolve the issue with your builder, lodge a
                  complaint with QBCC
                </li>
                <li>
                  <strong>Complete a claim form:</strong> Fill out the appropriate claim form available on the QBCC
                  website
                </li>
                <li>
                  <strong>Provide supporting documentation:</strong> Include your contract, payment records, photos of
                  defects, and any relevant correspondence
                </li>
                <li>
                  <strong>Pay the claim fee:</strong> A fee applies when lodging a claim (may be refunded if your claim
                  is successful)
                </li>
              </ol>
              <p className="mb-4">Important timeframes:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>
                  <strong>Non-completion claims:</strong> Must be lodged within 3 months of the contract being
                  terminated
                </li>
                <li>
                  <strong>Defect claims:</strong> Must be lodged within the warranty period (6 years and 6 months for
                  structural defects, 12 months for non-structural defects)
                </li>
              </ul>
              <p>
                For detailed instructions, visit the{" "}
                <a
                  href="https://www.qbcc.qld.gov.au/homeowners/home-warranty-insurance/making-claim"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  QBCC claims page
                </a>
                .
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="mt-12 pt-6 border-t">
          <h2 className="text-xl font-semibold mb-4">Still have questions?</h2>
          <p className="mb-6">For more detailed information, check out our guides or contact QBCC directly.</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/guides">
              <Button>View All Guides</Button>
            </Link>
            <a href="https://www.qbcc.qld.gov.au/contact-us" target="_blank" rel="noopener noreferrer">
              <Button variant="outline">Contact QBCC</Button>
            </a>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}
