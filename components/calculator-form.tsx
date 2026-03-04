import { useEffect, useRef, useState } from "react"
import { Field, Label, Description, FieldGroup, Fieldset } from "@/components/catalyst/fieldset"
import { Input } from "@/components/catalyst/input"
import { Select } from "@/components/catalyst/select"
import { Button } from "@/components/catalyst/button"
import { Text } from "@/components/catalyst/text"
import { Heading, Subheading } from "@/components/catalyst/heading"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/catalyst/card"
import { Divider } from "@/components/catalyst/divider"
import { 
  calculateQLDHomeWarrantyPremium, 
  calculateMultipleDwellingsPremium, 
  calculateQLDRenovationPremium, 
  calculateMultipleUnitsPremium,
  calculateQLeaveLevy
} from "@/lib/premium-calculator"
import { PremiumBreakdown } from "@/components/premium-breakdown"
import { QuoteTemplate } from "@/components/quote-template"
import { LeadCaptureModal } from "@/components/lead-capture-modal"
import { ArrowPathIcon, CalculatorIcon, PrinterIcon, ShareIcon, EnvelopeIcon, XMarkIcon } from "@heroicons/react/24/outline"
import { track } from "@vercel/analytics"
import { MAX_UNITS, MIN_INSURABLE_VALUE, formatNumberWithCommas, parseFormattedNumber, parsePositiveInteger } from "@/lib/validation"

// Australian locale for number formatting
const AU_LOCALE = "en-AU"

export function CalculatorForm() {
  const [workType, setWorkType] = useState("new-construction")
  const [insurableValue, setInsurableValue] = useState("")
  const [units, setUnits] = useState("1")
  const [isCalculating, setIsCalculating] = useState(false)
  const [result, setResult] = useState<{ premium: number, qleave: number, original: number, rounded: number } | null>(null)
  const [validationErrors, setValidationErrors] = useState<{ insurableValue?: string, units?: string }>({})
  const [showLeadModal, setShowLeadModal] = useState(false)
  const [hasShownLeadModal, setHasShownLeadModal] = useState(false)
  const [showRelayCta, setShowRelayCta] = useState(true)
  const leadModalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const getValidationErrors = (value: string, currentUnits: string) => {
    const errors: { insurableValue?: string, units?: string } = {}
    const parsedValue = parseFormattedNumber(value)
    const parsedUnits = parsePositiveInteger(currentUnits)

    if (!value.trim()) {
      errors.insurableValue = "Enter an insurable value."
    } else if (parsedValue === null) {
      errors.insurableValue = "Use numbers only, for example 250000."
    }

    if (!currentUnits.trim()) {
      errors.units = "Enter the number of units."
    } else if (parsedUnits === null) {
      errors.units = "Units must be a whole number of 1 or more."
    } else if (parsedUnits > MAX_UNITS) {
      errors.units = `Units must be ${MAX_UNITS} or less.`
    }

    return errors
  }

  const handleCalculate = () => {
    setIsCalculating(true)
    try {
      const errors = getValidationErrors(insurableValue, units)
      setValidationErrors(errors)
      if (errors.insurableValue || errors.units) {
        setResult(null)
        return
      }
      const value = parseFormattedNumber(insurableValue)
      const numUnits = parsePositiveInteger(units)
      if (value === null || numUnits === null || numUnits > MAX_UNITS) {
        setResult(null)
        return
      }

      track("calculate", {
        type: workType,
        value,
      })

      // Calculate rounded value
      let roundedValue = value
      if (value >= 3300 && roundedValue % 1000 > 0) {
        roundedValue = Math.floor(roundedValue / 1000) * 1000 + 1000
      }

      let premium = 0
      if (workType === "new-construction") {
        if (numUnits === 1) {
          premium = calculateQLDHomeWarrantyPremium(value)
        } else {
          premium = calculateMultipleDwellingsPremium(value, numUnits)
        }
      } else {
        if (numUnits === 1) {
          premium = calculateQLDRenovationPremium(value)
        } else {
          premium = calculateMultipleUnitsPremium(value, numUnits)
        }
      }

      // Calculate QLeave Levy
      const qleave = calculateQLeaveLevy(value)

      setResult({
        premium,
        qleave,
        original: value,
        rounded: roundedValue
      })

      // Show lead capture modal after first calculation (with a small delay for better UX)
      if (!hasShownLeadModal && premium > 0) {
        if (leadModalTimerRef.current) {
          clearTimeout(leadModalTimerRef.current)
        }
        leadModalTimerRef.current = setTimeout(() => {
          setShowLeadModal(true)
          setHasShownLeadModal(true)
          leadModalTimerRef.current = null
        }, 1500)
      }
    } catch (error) {
      console.error("Calculation error", error)
      setResult(null)
    } finally {
      setIsCalculating(false)
    }
  }

  // Auto-calculate effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (insurableValue) {
        handleCalculate()
      } else {
        setResult(null)
        setValidationErrors((current) => ({ ...current, insurableValue: undefined }))
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [insurableValue, units, workType])

  useEffect(() => {
    return () => {
      if (leadModalTimerRef.current) {
        clearTimeout(leadModalTimerRef.current)
      }
    }
  }, [])

  const handleReset = () => {
    setInsurableValue("")
    setUnits("1")
    setValidationErrors({})
    setResult(null)
  }

  const handlePrint = () => {
    if (!result) return
    track("print_click")
    window.print()
  }

  const handleShare = () => {
    if (!result) return
    const value = parseFormattedNumber(insurableValue)
    const parsedUnits = parsePositiveInteger(units)
    if (value === null || parsedUnits === null || parsedUnits > MAX_UNITS) {
      return
    }
    track("share_click")
    const unitsQuery = parsedUnits > 1 ? `?units=${parsedUnits}` : ""
    const url = `/estimate/${workType}/${encodeURIComponent(value.toString())}${unitsQuery}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const handleRelayClick = () => {
    track("relay_cta_click")
    window.dispatchEvent(new CustomEvent("leva-relay-cta-click", {
      detail: {
        source: "calculator-results",
        workType
      }
    }))
  }

  const parsedUnits = parsePositiveInteger(units) ?? 1
  const validationMessage = validationErrors.insurableValue || validationErrors.units

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-leva-navy/5 rounded-lg text-leva-navy">
                  <CalculatorIcon className="size-6" />
                </div>
                <div>
                  <Heading level={2}>Premium Calculator</Heading>
                  <Text>Enter your project details below.</Text>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <Fieldset>
                <FieldGroup>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field className="md:col-span-2">
                      <Label>Work Type</Label>
                      <Description>Select the type of construction work.</Description>
                      <Select 
                        name="work_type" 
                        value={workType} 
                        onChange={(e) => setWorkType(e.target.value)}
                      >
                        <option value="new-construction">New Construction</option>
                        <option value="renovation">Renovation / Addition</option>
                      </Select>
                    </Field>

                    <Field>
                      <Label>Insurable Value ($)</Label>
                      <Description>Contract price or cost to build (Incl. GST).</Description>
                      <Input 
                        name="insurable_value" 
                        placeholder="e.g. 250,000" 
                        value={insurableValue}
                        aria-invalid={Boolean(validationErrors.insurableValue)}
                        onChange={(e) => {
                          setInsurableValue(formatNumberWithCommas(e.target.value))
                          if (validationErrors.insurableValue) {
                            setValidationErrors((current) => ({ ...current, insurableValue: undefined }))
                          }
                        }}
                        onBlur={() => {
                          const errors = getValidationErrors(insurableValue, units)
                          setValidationErrors((current) => ({ ...current, insurableValue: errors.insurableValue }))
                        }}
                      />
                      {validationErrors.insurableValue && (
                        <Text className="mt-2 text-sm text-red-600 dark:text-red-400">
                          {validationErrors.insurableValue}
                        </Text>
                      )}
                    </Field>

                    <Field>
                      <Label>Number of Units</Label>
                      <Description>For multiple dwellings.</Description>
                      <Input 
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        name="units" 
                        value={units}
                        aria-invalid={Boolean(validationErrors.units)}
                        onChange={(e) => {
                          const nextValue = e.target.value.replace(/[^\d]/g, "")
                          setUnits(nextValue)
                          if (validationErrors.units) {
                            setValidationErrors((current) => ({ ...current, units: undefined }))
                          }
                        }}
                        onBlur={() => {
                          if (!units.trim()) {
                            setUnits("1")
                          }
                          const errors = getValidationErrors(insurableValue, units || "1")
                          setValidationErrors((current) => ({ ...current, units: errors.units }))
                        }}
                      />
                      {validationErrors.units && (
                        <Text className="mt-2 text-sm text-red-600 dark:text-red-400">
                          {validationErrors.units}
                        </Text>
                      )}
                    </Field>
                  </div>
                </FieldGroup>
              </Fieldset>
            </CardContent>
            
            <CardFooter>
               <div className="flex w-full justify-between items-center">
                  <Text className="text-xs">
                     Values update automatically.
                  </Text>
                  <Button plain onClick={handleReset}>
                    <ArrowPathIcon className="size-4 mr-2" />
                    Reset
                  </Button>
               </div>
            </CardFooter>
          </Card>

          {/* Breakdown Section - Only show if we have a result */}
          {result && (
              <div className="mt-6 space-y-4">
                 <PremiumBreakdown 
                    type={workType as "new-construction" | "renovation"}
                    originalValue={result.original}
                    roundedValue={result.rounded}
                    units={parsedUnits}
                    premium={result.premium}
                 />

                 {showRelayCta && (
                  <Card className="border-leva-navy/15 bg-leva-navy/[0.03]">
                    <CardContent className="p-4 md:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Subheading level={3} className="text-leva-navy">Never miss inbound jobs</Subheading>
                          <Text className="mt-2 text-sm leading-6 text-gray-700">
                            You&apos;re a QLD builder? While you&apos;re on site, your phone&apos;s still ringing. Leva Relay is an AI receptionist that answers calls, books jobs, and sends quotes — so you never miss work.
                          </Text>
                          <a
                            href="https://levasolutions.com.au/relay"
                            target="_blank"
                            rel="noreferrer"
                            onClick={handleRelayClick}
                            data-track-event="leva-relay-cta-click"
                            data-track-source="calculator-results"
                            className="mt-3 inline-flex items-center text-sm font-semibold text-leva-navy hover:text-leva-navy-light"
                          >
                            Try it free →
                          </a>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowRelayCta(false)}
                          aria-label="Dismiss Leva Relay message"
                          className="shrink-0 rounded-md p-1 text-gray-500 hover:bg-black/5 hover:text-gray-700"
                        >
                          <XMarkIcon className="size-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                 )}
              </div>
          )}
          {!result && (
            <Card className="border-dashed border-zinc-300 dark:border-zinc-700">
              <CardContent className="p-5">
                <Text className="text-sm text-zinc-700 dark:text-zinc-300">
                  {isCalculating
                    ? "Updating estimate..."
                    : validationMessage || "Enter an insurable value and units to view your premium estimate."}
                </Text>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1 space-y-6">
           {/* Insurance Summary */}
           <Card className="sticky top-6 bg-leva-navy text-white border-leva-navy-light">
              <div className="p-6 border-b border-white/10 flex justify-between items-start">
                  <div>
                    <Heading level={3} className="text-white! dark:text-white!">Estimated Costs</Heading>
                    <Text className="text-leva-grey-light! dark:text-gray-400!">Total Compliance Estimate</Text>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleShare}
                      disabled={!result}
                      aria-disabled={!result}
                      className="text-white/70 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Share / View Quote"
                    >
                      <ShareIcon className="size-5" />
                    </button>
                    <button
                      onClick={handlePrint}
                      disabled={!result}
                      aria-disabled={!result}
                      className="text-white/70 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Print Estimate"
                    >
                      <PrinterIcon className="size-5" />
                    </button>
                  </div>
              </div>
              <div className="p-6 space-y-6">
                  <div>
                      <Text className="text-leva-grey-light! dark:text-gray-400! text-sm uppercase tracking-wider font-bold">Total Payable</Text>
                      <div className="text-4xl font-bold text-white mt-2">
                          {result ? `$${(result.premium + result.qleave).toLocaleString(AU_LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'}
                      </div>
                  </div>

                  <Divider className="border-white/10" />

                                      <div className="space-y-3">
                      <div className="flex justify-between text-sm items-center">
                          <span className="text-gray-300">QBCC Insurance</span>
                          <span className="font-medium">{result ? `$${result.premium.toLocaleString(AU_LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'}</span>
                      </div>
                                          <div className="flex justify-between text-sm items-center">
                                              <div className="flex items-center gap-1.5">
                                                 <span className="text-gray-300">QLeave Levy</span>
                                                 {result && result.qleave > 0 && (
                                                    <span className="flex items-center text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                      <span className="mr-1.5 relative flex h-1.5 w-1.5">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                                      </span>
                                                      Live Rate: 0.575%
                                                    </span>
                                                 )}
                                              </div>
                                              <span className="font-medium">{result ? `$${result.qleave.toLocaleString(AU_LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'}</span>
                                          </div>
                                      </div>
                                      {!result && (
                                        <div className="p-3 rounded bg-white/10 border border-white/20 text-sm text-white">
                                          Enter project details to calculate premium and levy totals.
                                        </div>
                                      )}
                      
                                      {result && result.original < MIN_INSURABLE_VALUE && (
                                          <div className="p-3 rounded bg-white/10 border border-white/20 text-sm text-white">
                                              Minimum insurable value is ${MIN_INSURABLE_VALUE.toLocaleString(AU_LOCALE)}. No premium payable.
                                          </div>
                                      )}
                                  </div>
                                  <div className="p-6 bg-leva-navy-deep rounded-b-xl border-t border-white/10">
                                      <div className="grid grid-cols-2 gap-3">
                                         <Button
                                           href="https://my.qbcc.qld.gov.au"
                                           target="_blank"
                                           rel="noreferrer"
                                           onClick={() => {
                                             if (result) {
                                               track("pay_qbcc_click", { premium: result.premium })
                                             }
                                           }}
                                           className="w-full justify-center bg-leva-orange hover:bg-leva-orange-light text-white border-none text-xs px-2"
                                         >
                                           Pay QBCC
                                         </Button>
                                         <Button
                                           href="https://www.qleave.qld.gov.au"
                                           target="_blank"
                                           rel="noreferrer"
                                           onClick={() => track("pay_qleave_click")}
                                           className="w-full justify-center bg-white/10 hover:bg-white/20 text-white border-none text-xs px-2"
                                         >
                                           Pay QLeave
                                         </Button>
                                      </div>
                                      {result && (
                                        <div className="mt-3">
                                          <Button 
                                            onClick={() => setShowLeadModal(true)}
                                            className="w-full justify-center bg-emerald-600 hover:bg-emerald-500 text-white border-none text-xs px-2 flex items-center gap-2"
                                          >
                                            <EnvelopeIcon className="size-3" />
                                            Email This Quote
                                          </Button>
                                        </div>
                                      )}
                                      <div className="mt-4 text-center">
                                          <Text className="text-xs text-gray-400!">
                                              Insurance premiums based on QBCC 2020 Tables. QLeave levy verified against live government data.
                                          </Text>
                                      </div>
                                  </div>                              </Card>        </div>
      </div>

      {/* Print Layout */}
      <div className="hidden print:block">
        {result && (
          <QuoteTemplate 
            workType={workType}
            insurableValue={insurableValue}
            units={parsedUnits}
            premium={result.premium}
            qleave={result.qleave}
          />
        )}
      </div>

      {/* Lead Capture Modal */}
      {result && (
        <LeadCaptureModal
          isOpen={showLeadModal}
          onClose={() => setShowLeadModal(false)}
          quoteData={{
            workType,
            insurableValue: result.original,
            units: parsedUnits,
            premium: result.premium,
            qleave: result.qleave
          }}
        />
      )}
    </>
  )
}
