export const HOMEPAGE_SITE_NAME = "QBCC Home Warranty Insurance Calculator"
export const HOMEPAGE_SITE_URL = "https://www.qbccinsurancecalculator.com.au/"

export const HOMEPAGE_INTRO =
  "This free QBCC home warranty insurance calculator gives Queensland builders and homeowners the premium and QLeave levy for residential building work. Pick new construction or renovation, enter the insurable value including GST, and set the number of dwellings. Your estimate updates as you type. A $300,000 new home comes to $2,102.10 in premium plus a $1,568.18 QLeave levy, $3,670.28 in total. It uses the QBCC premium tables effective 1 July 2020. It is an estimate only, so confirm the final figure with QBCC."

export const HOMEPAGE_FAQS = [
  {
    question: "How much does QBCC home warranty insurance cost?",
    answer:
      "It depends on the insurable value and work type. A $300,000 new home is $2,102.10 in premium, or $3,670.28 with the QLeave levy. A $300,000 renovation is $3,629.65 in premium, or $5,197.83 in total.",
  },
  {
    question: "When is QBCC insurance required?",
    answer:
      "For most residential building work in Queensland valued at over $3,300, including labour and materials.",
  },
  {
    question: "Who pays for QBCC insurance?",
    answer:
      "The licensed contractor takes out the policy and pays the premium. The cost is usually passed on to the homeowner, and it should be itemised in the building contract.",
  },
  {
    question: "Is the QLeave levy part of the QBCC premium?",
    answer:
      "No. They are separate costs. The levy is 0.575% of the GST-exclusive value and only applies once the work reaches $150,000 excluding GST.",
  },
  {
    question: "What is the difference between new construction and renovation?",
    answer:
      "New construction is a new structure from the ground up, like a house, duplex or unit. Renovation is work on an existing structure, including alterations, additions and repairs. Each uses its own premium table.",
  },
  {
    question: "How accurate is the calculator?",
    answer:
      "It uses the official QBCC premium tables effective 1 July 2020. It is for information only. Always verify the final premium with QBCC before you make financial decisions.",
  },
] as const

export const homepageWebApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: HOMEPAGE_SITE_NAME,
  url: HOMEPAGE_SITE_URL,
  applicationCategory: "FinanceApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "AUD",
  },
  description: HOMEPAGE_INTRO,
  provider: {
    "@type": "Organization",
    name: HOMEPAGE_SITE_NAME,
    url: HOMEPAGE_SITE_URL,
    description: HOMEPAGE_INTRO,
  },
  featureList: [
    "Calculate premiums for new construction",
    "Calculate premiums for renovations and additions",
    "Support for multiple dwelling calculations",
    "Based on current QBCC premium rates (effective 1 July 2020)",
  ],
  keywords:
    "QBCC, home warranty, insurance calculator, Queensland Building and Construction Commission, premium calculator",
  audience: {
    "@type": "Audience",
    audienceType: "Builders, Homeowners, Construction Industry",
  },
}

export const homepageServiceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: HOMEPAGE_SITE_NAME,
  url: HOMEPAGE_SITE_URL,
  description: HOMEPAGE_INTRO,
  provider: {
    "@type": "Organization",
    name: "Leva Solutions",
    url: "https://levasolutions.com.au",
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "AUD",
  },
  areaServed: "Queensland",
  audience: {
    "@type": "Audience",
    audienceType: "Builders, Homeowners, Construction Industry",
  },
}

export const homepageFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: HOMEPAGE_FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
}
