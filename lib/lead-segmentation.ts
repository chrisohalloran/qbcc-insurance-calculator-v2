export type ValueBand = "<3.3k" | "3.3k-49k" | "50k-149k" | "150k-499k" | "500k-2.9m" | "3m+"

export type ProjectSegment =
  | "new_build_small"
  | "new_build_solar_ready"
  | "renovation_small"
  | "renovation_pipeline"
  | "multi_unit_project"

export type OfferAction = "external_link" | "email_quote"

export interface QuoteContext {
  workType: string
  insurableValue: number
  units: number
  premium: number
  qleave: number
}

export interface RecommendedOffer {
  id: string
  partner: "Trade Solar" | "Leva Relay" | "QBCC Calculator"
  projectSegment: ProjectSegment
  title: string
  body: string
  reason: string
  ctaLabel: string
  action: OfferAction
  href?: string
}

export interface QuoteAnalyticsProperties {
  work_type: string
  insurable_value: number
  value_band: ValueBand
  num_units: number
  units_band: "single" | "multi"
  premium_calculated: number
  qleave_calculated: number
  total_calculated: number
  qleave_applicable: boolean
  project_segment: ProjectSegment
  recommended_offer_id: string
  recommended_offer_partner: string
}

type OfferAttributionParams = Record<string, string>

const TRADE_SOLAR_URL = "https://tradesolar.com.au/"
const LEVA_RELAY_URL = "https://levasolutions.com.au/relay"
const OFFER_UTM_SOURCE = "qbcc_insurance_calculator"
const OFFER_UTM_MEDIUM = "calculator_offer"
const OFFER_UTM_CAMPAIGN = "qbcc_cross_sell"

export function getValueBand(value: number): ValueBand {
  if (value < 3_300) return "<3.3k"
  if (value < 50_000) return "3.3k-49k"
  if (value < 150_000) return "50k-149k"
  if (value < 500_000) return "150k-499k"
  if (value < 3_000_000) return "500k-2.9m"
  return "3m+"
}

export function getProjectSegment(context: QuoteContext): ProjectSegment {
  if (context.units > 1) {
    return "multi_unit_project"
  }

  if (context.workType === "new-construction") {
    return context.insurableValue >= 150_000 ? "new_build_solar_ready" : "new_build_small"
  }

  return context.insurableValue >= 50_000 ? "renovation_pipeline" : "renovation_small"
}

export function getRecommendedOffer(context: QuoteContext): RecommendedOffer {
  const projectSegment = getProjectSegment(context)

  if (projectSegment === "multi_unit_project") {
    return {
      id: "qbcc_multi_unit_pack",
      partner: "QBCC Calculator",
      projectSegment,
      title: "Working across multiple dwellings?",
      body:
        "Email the quote with the unit count attached so you have a clean record before lodging QBCC and QLeave separately.",
      reason: "Multiple-unit projects are more likely to need a saved paper trail.",
      ctaLabel: "Email quote pack",
      action: "email_quote",
    }
  }

  if (projectSegment === "new_build_solar_ready") {
    return {
      id: "trade_solar_new_build",
      partner: "Trade Solar",
      projectSegment,
      title: "Planning a new build? Make it solar-ready before handover.",
      body:
        "Trade Solar works with new-build projects and builder-friendly solar packages, so solar can be priced while the job is still moving.",
      reason: "New construction above the QLeave threshold is a strong fit for solar planning.",
      ctaLabel: "Get a solar quote",
      action: "external_link",
      href: TRADE_SOLAR_URL,
    }
  }

  if (projectSegment === "renovation_pipeline") {
    return {
      id: "leva_relay_renovation_pipeline",
      partner: "Leva Relay",
      projectSegment,
      title: "Renovation enquiries usually mean calls, callbacks, and quote follow-up.",
      body:
        "Leva Relay answers inbound calls, captures job details, and helps keep renovation leads from leaking while you are on site.",
      reason: "Mid-to-large renovations are high-intent job leads for builders.",
      ctaLabel: "See Leva Relay",
      action: "external_link",
      href: LEVA_RELAY_URL,
    }
  }

  if (projectSegment === "renovation_small") {
    return {
      id: "qbcc_renovation_quote_record",
      partner: "QBCC Calculator",
      projectSegment,
      title: "Save this renovation estimate before you lodge.",
      body:
        "Email yourself the quote so the work type, value, premium, and QLeave estimate are all in one place.",
      reason: "Smaller renovation calculations are often repeat visits and quote checks.",
      ctaLabel: "Email this quote",
      action: "email_quote",
    }
  }

  return {
    id: "qbcc_new_build_quote_record",
    partner: "QBCC Calculator",
    projectSegment,
    title: "Keep a copy of this new-build estimate.",
    body:
      "Email the quote now so you can compare it with the final QBCC portal amount when you lodge.",
    reason: "New-build calculations below the solar threshold still benefit from saved quote records.",
    ctaLabel: "Email this quote",
    action: "email_quote",
  }
}

export function buildQuoteAnalyticsProperties(context: QuoteContext): QuoteAnalyticsProperties {
  const offer = getRecommendedOffer(context)

  return {
    work_type: context.workType,
    insurable_value: context.insurableValue,
    value_band: getValueBand(context.insurableValue),
    num_units: context.units,
    units_band: context.units > 1 ? "multi" : "single",
    premium_calculated: context.premium,
    qleave_calculated: context.qleave,
    total_calculated: context.premium + context.qleave,
    qleave_applicable: context.qleave > 0,
    project_segment: offer.projectSegment,
    recommended_offer_id: offer.id,
    recommended_offer_partner: offer.partner,
  }
}

export function buildOfferAttributionParams(analytics: QuoteAnalyticsProperties): OfferAttributionParams {
  return {
    utm_source: OFFER_UTM_SOURCE,
    utm_medium: OFFER_UTM_MEDIUM,
    utm_campaign: OFFER_UTM_CAMPAIGN,
    utm_content: analytics.recommended_offer_id,
    utm_term: analytics.project_segment,
    source: OFFER_UTM_SOURCE,
    ref: "qbcc_calculator",
    offer_id: analytics.recommended_offer_id,
    offer_partner: analytics.recommended_offer_partner,
    project_segment: analytics.project_segment,
    work_type: analytics.work_type,
    value_band: analytics.value_band,
    units_band: analytics.units_band,
    qleave_applicable: String(analytics.qleave_applicable),
  }
}

export function buildAttributedOfferHref(
  offer: RecommendedOffer,
  analytics: QuoteAnalyticsProperties,
): string | undefined {
  if (!offer.href) {
    return undefined
  }

  try {
    const url = new URL(offer.href)
    const params = buildOfferAttributionParams(analytics)

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })

    return url.toString()
  } catch {
    return offer.href
  }
}
