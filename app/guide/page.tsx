import type { Metadata } from "next"
import Script from "next/script"
import Link from "next/link"
import { ContentLayout } from "@/components/content-layout"

export const metadata: Metadata = {
  title: "QBCC Home Warranty Insurance: Complete 2026 Guide",
  description:
    "Learn how QBCC home warranty insurance works in Queensland, who pays it, what it covers, and how to estimate premiums in 2026.",
  alternates: { canonical: "https://www.qbccinsurancecalculator.com.au/guide" },
  openGraph: {
    title: "QBCC Home Warranty Insurance: Complete 2026 Guide",
    description:
      "A practical Queensland guide to QBCC home warranty insurance requirements, coverage periods, and premium rules.",
    type: "article",
    url: "https://www.qbccinsurancecalculator.com.au/guide",
  },
}

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      headline: "QBCC Home Warranty Insurance: Complete 2026 Guide",
      description:
        "A practical Queensland guide to QBCC home warranty insurance requirements, coverage periods, and premium rules.",
      datePublished: "2026-02-13",
      dateModified: "2026-02-13",
      inLanguage: "en-AU",
      mainEntityOfPage: "https://www.qbccinsurancecalculator.com.au/guide",
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "When is QBCC home warranty insurance required?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "It is generally required for residential construction work in Queensland over $3,300, including labour, materials, and GST.",
          },
        },
        {
          "@type": "Question",
          name: "How long does cover last?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Cover is generally up to 6 years and 6 months from the earlier of paying the premium, entering the contract, or starting work.",
          },
        },
      ],
    },
  ],
}

export default function GuidePage() {
  return (
    <>
      <Script id="guide-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <ContentLayout
        currentPath="/guide"
        title="QBCC Home Warranty Insurance: Complete 2026 Guide"
        intro="QBCC home warranty insurance is mandatory for most residential building work in Queensland over $3,300. This guide explains who needs it, what it covers, and how to estimate your premium before you sign a contract."
      >
        <h2>What is QBCC home warranty insurance?</h2>
        <p>
          QBCC home warranty insurance is part of the Queensland Home Warranty Scheme. It is a statutory safety net for residential owners when a licensed contractor does not finish work, cannot finish work, or does not rectify defects.
        </p>
        <p>
          You will also see it called Queensland Home Warranty Scheme cover or domestic building insurance. In day to day builder conversations, most people just call it QBCC insurance.
        </p>

        <h2>When it applies in Queensland</h2>
        <p>
          The key threshold is <strong>$3,300</strong>. For most residential construction work above that value, cover must be in place. The insurable value includes labour, materials, and GST.
        </p>
        <p>
          Queensland rules can catch people out on renovations because related work can still be insurable. A kitchen refit in Brisbane, a bathroom renovation on the Gold Coast, or structural deck work in Townsville can all trigger requirements once value is above threshold.
        </p>

        <h2>Who buys and pays the premium</h2>
        <p>
          The licensed contractor takes out the policy through QBCC channels such as myQBCC, manual form, or phone lodgement. It is not a broker product. The contractor usually collects this amount from the owner under the contract and pays QBCC.
        </p>
        <p>
          If you are comparing quotes, ask each builder whether the premium is clearly shown and whether insurable value assumptions are documented. This avoids pricing surprises at deposit stage.
        </p>

        <h2>How long cover lasts</h2>
        <p>
          QBCC states cover can run for <strong>6 years and 6 months</strong> from the earlier of premium payment, contract date, or work start date, with limited extensions where relevant. Time limits for claims differ between non-completion, structural defects, and non-structural defects.
        </p>

        <h2>How the premium is calculated</h2>
        <p>
          Premium is based on the <strong>insurable value</strong> of the work. For some multi-dwelling projects, notional pricing can apply and calculations are performed per dwelling before totals are combined.
        </p>
        <p>
          On jobs above $150,000 excluding GST, builders also need to consider QLeave levy in project pricing. That levy is separate to the QBCC premium.
        </p>

        <h2>What is commonly excluded</h2>
        <p>
          Not all construction is insurable under the scheme. For example, buildings over 3 storeys above a car park are generally outside residential scheme scope, and there are specific exclusions for owner-builder work.
        </p>

        <h2>Practical 2026 checklist before contract signing</h2>
        <ul>
          <li>Confirm the contractor licence class matches the work.</li>
          <li>Confirm insurable value includes labour, materials, and GST.</li>
          <li>Confirm premium line item is shown in contract pricing.</li>
          <li>Confirm policy is taken out through QBCC process.</li>
          <li>Keep policy and contract records for future claim periods.</li>
        </ul>

        <h2>Key takeaways</h2>
        <ul>
          <li>Most Queensland residential building work over $3,300 needs cover.</li>
          <li>Policy is taken out directly through QBCC processes.</li>
          <li>Cover period is commonly up to 6 years and 6 months.</li>
          <li>Premium is driven by insurable value of the work.</li>
        </ul>

        <h2>Related internal pages</h2>
        <ul>
          <li><Link href="/">Calculate your premium estimate now</Link></li>
          <li><Link href="/who-needs-it">Do I Need QBCC Home Warranty Insurance?</Link></li>
          <li><Link href="/costs">How much QBCC insurance costs in 2026</Link></li>
          <li><Link href="/owner-builder">Owner builder insurance requirements in QLD</Link></li>
        </ul>
      </ContentLayout>
    </>
  )
}
