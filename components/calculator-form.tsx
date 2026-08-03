import { useState, useEffect } from "react"
import { Field, Label, Description, FieldGroup, Fieldset, Legend } from "@repo/ui/catalyst/fieldset"
import { Input, InputGroup } from "@repo/ui/catalyst/input"
import { Select } from "@repo/ui/catalyst/select"
import { Button } from "@repo/ui/catalyst/button"
import { Text, Strong } from "@repo/ui/catalyst/text"
import { Heading, Subheading } from "@repo/ui/catalyst/heading"
import { Card, CardHeader, CardContent, CardFooter } from "@repo/ui/catalyst/card"
import { Divider } from "@repo/ui/catalyst/divider"
import { 
  calculateQLDHomeWarrantyPremium, 
  calculateMultipleDwellingsPremium, 
  calculateQLDRenovationPremium, 
  calculateMultipleUnitsPremium,
  calculateQLeaveLevy
} from "@/lib/premium-calculator"
import { PremiumBreakdown } from "@/components/premium-breakdown"
import { QuoteTemplate } from "@/components/quote-template"
import { ArrowPathIcon, CurrencyDollarIcon, CalculatorIcon, BuildingOffice2Icon, PrinterIcon, ShareIcon } from "@heroicons/react/24/outline"

// Australian locale for number formatting
const AU_LOCALE = "en-AU"

export function CalculatorForm() {
  const [workType, setWorkType] = useState("new-construction")
  const [insurableValue, setInsurableValue] = useState("")
  const [units, setUnits] = useState("1")
  const [isCalculating, setIsCalculating] = useState(false)
  const [result, setResult] = useState<{ premium: number, qleave: number, original: number, rounded: number } | null>(null)

  // Format number with commas
  const formatNumberWithCommas = (value: string): string => {
    const numericValue = value.replace(/[^\d.]/g, "")
    if (!numericValue) return ""
    const num = Number.parseFloat(numericValue)
    if (isNaN(num)) return ""
    return num.toLocaleString(AU_LOCALE, { maximumFractionDigits: 2 })
  }

  const parseFormattedNumber = (value: string): string => {
    return value.replace(/,/g, "")
  }

  const handleCalculate = () => {
    setIsCalculating(true)
    try {
      const value = Number.parseFloat(parseFormattedNumber(insurableValue))
      const numUnits = Number.parseInt(units)

      if (isNaN(value) || value < 0 || isNaN(numUnits) || numUnits <= 0) {
        setResult(null)
        return
      }

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
      if (insurableValue) handleCalculate()
    }, 500)
    return () => clearTimeout(timer)
  }, [insurableValue, units, workType])

  useEffect(() => {
    // Update URL params logic can go here if needed
    // For now, we will stick to dynamic updates
  }, [workType, insurableValue, units])

  const handleReset = () => {
    setInsurableValue("")
    setUnits("1")
    setResult(null)
  }

  const handlePrint = () => {
    window.print();
  }

  const handleShare = () => {
    if (!result) return
    const cleanValue = parseFormattedNumber(insurableValue)
    const url = `/estimate/${workType}/${cleanValue}?units=${units}`
    window.open(url, '_blank')
  }

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
                        onChange={(e) => {
                          setInsurableValue(formatNumberWithCommas(e.target.value))
                        }}
                      />
                    </Field>

                    <Field>
                      <Label>Number of Units</Label>
                      <Description>For multiple dwellings.</Description>
                      <Input 
                        type="number" 
                        name="units" 
                        min="1" 
                        value={units}
                        onChange={(e) => setUnits(e.target.value)} 
                      />
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
              <div className="mt-6">
                 <PremiumBreakdown 
                    type={workType as "new-construction" | "renovation"}
                    originalValue={result.original}
                    roundedValue={result.rounded}
                    units={parseInt(units)}
                    premium={result.premium}
                 />
              </div>
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
                    <button onClick={handleShare} className="text-white/70 hover:text-white transition-colors" title="Share / View Quote">
                      <ShareIcon className="size-5" />
                    </button>
                    <button onClick={handlePrint} className="text-white/70 hover:text-white transition-colors" title="Print Estimate">
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
                      
                                      {result && result.original < 3300 && (
                                          <div className="p-3 rounded bg-white/10 border border-white/20 text-sm text-white">
                                              Minimum insurable value is $3,300. No premium payable.
                                          </div>
                                      )}
                                  </div>
                                  <div className="p-6 bg-leva-navy-deep rounded-b-xl border-t border-white/10">
                                      <div className="grid grid-cols-2 gap-3">
                                         <Button className="w-full justify-center bg-leva-orange hover:bg-leva-orange-light text-white border-none text-xs px-2">
                                             Pay QBCC
                                         </Button>
                                         <Button className="w-full justify-center bg-white/10 hover:bg-white/20 text-white border-none text-xs px-2">
                                             Pay QLeave
                                         </Button>
                                      </div>
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
            units={parseInt(units)}
            premium={result.premium}
            qleave={result.qleave}
          />
        )}
      </div>
    </>
  )
}
