import { QuoteTemplate } from "@/components/quote-template"
import { EstimateLeadCapture } from "@/components/estimate-lead-capture"
import { 
  calculateQLDHomeWarrantyPremium, 
  calculateMultipleDwellingsPremium, 
  calculateQLDRenovationPremium, 
  calculateMultipleUnitsPremium,
  calculateQLeaveLevy
} from "@/lib/premium-calculator"
import { MAX_UNITS, parsePositiveInteger } from "@/lib/validation"
import { Metadata } from "next"
import { notFound } from "next/navigation"

// Australian locale for number formatting
const AU_LOCALE = "en-AU"

interface Props {
  params: {
    type: string
    value: string
  }
  searchParams: {
    units?: string | string[]
  }
}

const VALID_TYPES = ["new-construction", "renovation"] as const

function getSingleSearchParam(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function parseRouteValue(value: string): number | null {
  if (!/^\d+(\.\d+)?$/.test(value)) {
    return null
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null
  }

  return parsed
}

function parseUnitsParam(value?: string | string[]): number | null {
  const rawUnits = getSingleSearchParam(value) ?? "1"
  const parsedUnits = parsePositiveInteger(rawUnits)
  if (parsedUnits === null || parsedUnits > MAX_UNITS) {
    return null
  }

  return parsedUnits
}

// Generate static params for common price points to make them instant (Static Site Generation)
export async function generateStaticParams() {
  const commonValues = [300000, 450000, 600000, 50000, 150000, 250000]
  
  const newConstructionParams = commonValues.map((value) => ({
    type: 'new-construction',
    value: value.toString(),
  }))

  const renovationParams = commonValues.map((value) => ({
    type: 'renovation',
    value: value.toString(),
  }))

  return [...newConstructionParams, ...renovationParams]
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { type, value } = params
  const insurableValue = parseRouteValue(value)
  const units = parseUnitsParam(searchParams.units)
  if (!VALID_TYPES.includes(type as (typeof VALID_TYPES)[number]) || insurableValue === null || units === null) {
    return {
      title: "QBCC Insurance Estimate",
      description: "View your QBCC estimate.",
      robots: {
        index: false,
        follow: false,
      },
    }
  }
  
  const formattedValue = insurableValue.toLocaleString(AU_LOCALE, { 
    style: 'currency', 
    currency: 'AUD',
    maximumFractionDigits: 0 
  })

  const typeName = type === 'renovation' ? 'Renovation' : 'New Construction'

  const unitsQuery = units > 1 ? `?units=${units}` : ""
  return {
    title: `QBCC Insurance Estimate: ${formattedValue} ${typeName}`,
    description: `Estimated QBCC Home Warranty Insurance and QLeave levy for a ${formattedValue} ${typeName.toLowerCase()} project.`,
    robots: {
        index: true,
        follow: true,
    },
    alternates: {
      canonical: `https://qbccinsurancecalculator.com.au/estimate/${type}/${value}${unitsQuery}`,
    },
  }
}

export default function EstimatePage({ params, searchParams }: Props) {
  const { type, value } = params
  const units = parseUnitsParam(searchParams.units)
  const insurableValue = parseRouteValue(value)

  if (insurableValue === null || units === null) {
    notFound()
  }

  if (!VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
    notFound()
  }

  // Calculate Logic (Server Side)
  let premium = 0
  if (type === "new-construction") {
    if (units === 1) {
      premium = calculateQLDHomeWarrantyPremium(insurableValue)
    } else {
      premium = calculateMultipleDwellingsPremium(insurableValue, units)
    }
  } else {
    if (units === 1) {
      premium = calculateQLDRenovationPremium(insurableValue)
    } else {
      premium = calculateMultipleUnitsPremium(insurableValue, units)
    }
  }

  const qleave = calculateQLeaveLevy(insurableValue)

  // Format value string for display (re-add commas)
  const formattedValueString = insurableValue.toLocaleString(AU_LOCALE, { maximumFractionDigits: 2 })

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <QuoteTemplate 
        workType={type}
        insurableValue={formattedValueString}
        units={units}
        premium={premium}
        qleave={qleave}
      />
      
      <EstimateLeadCapture 
        quoteData={{
          workType: type,
          insurableValue,
          units,
          premium,
          qleave
        }}
      />
      
      <div className="max-w-[210mm] mx-auto mt-8 text-center print:hidden">
        <a 
            href="/" 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-leva-navy text-white hover:bg-leva-navy-light h-10 px-4 py-2"
        >
            Calculate Another Estimate
        </a>
      </div>
    </main>
  )
}
