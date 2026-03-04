import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card } from "@/components/ui/card"
import { Info, AlertTriangle } from "lucide-react"

interface PremiumBreakdownProps {
  type: "new-construction" | "renovation"
  originalValue: number
  roundedValue: number | null
  units: number
  premium: number
}

// Australian locale for number formatting
const AU_LOCALE = "en-AU"

// Format currency for display
const formatCurrency = (value: number): string => {
  return value.toLocaleString(AU_LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function PremiumBreakdown({ type, originalValue, roundedValue, units, premium }: PremiumBreakdownProps) {
  // Determine if this is a high-value calculation (over $3M)
  const isHighValue = roundedValue && roundedValue > 3000000

  // Base amount for values over $3M
  const baseAmount = type === "new-construction" ? 20671.45 : 14490.25

  // Calculate excess thousands for high-value projects
  const excess = isHighValue ? roundedValue - 3000000 : 0
  const excessThousands = Math.ceil(excess / 1000)
  const additionalPremium = excessThousands * 3.2

  // Calculate per-unit premium for multiple units
  const premiumPerUnit = units > 1 ? premium / units : premium

  // Check if value is below minimum threshold
  const isBelowMinimum = originalValue < 3300

  return (
    <div className="space-y-4">
      {/* Minimum threshold warning */}
      {isBelowMinimum && (
        <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Below Minimum Threshold</AlertTitle>
          <AlertDescription>
            The insurable value is below the minimum threshold of $3,300. No premium is payable for values below this
            threshold.
          </AlertDescription>
        </Alert>
      )}

      {/* High value notice */}
      {isHighValue && (
        <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <Info className="h-4 w-4" />
          <AlertTitle className="text-sm">High-Value Calculation</AlertTitle>
          <AlertDescription className="text-xs sm:text-sm">
            For insurable values over $3,000,000, a special calculation method applies.
          </AlertDescription>
        </Alert>
      )}

      <Card className="p-3 sm:p-4 overflow-hidden">
        <h3 className="font-semibold mb-3 text-base">Premium Calculation Breakdown</h3>

        <div className="space-y-2 text-xs sm:text-sm">
          {/* Step 1: Original Value */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Original insurable value:</span>
            <span className="font-medium">${originalValue.toLocaleString(AU_LOCALE)}</span>
          </div>

          {/* Step 2: Minimum Threshold Check */}
          {isBelowMinimum ? (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Minimum threshold check:</span>
              <span className="font-medium text-amber-600 dark:text-amber-400">Below $3,300 minimum</span>
            </div>
          ) : (
            <>
              {/* Step 3: Rounded Value (if different) */}
              {roundedValue && roundedValue !== originalValue && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Rounded up to next $1,000:</span>
                  <span className="font-medium">${roundedValue.toLocaleString(AU_LOCALE)}</span>
                </div>
              )}

              {/* High-value calculation steps */}
              {isHighValue ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Base premium for $3,000,000:</span>
                    <span className="font-medium">${formatCurrency(baseAmount)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Amount over $3,000,000:</span>
                    <span className="font-medium">${excess.toLocaleString(AU_LOCALE)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Additional premium:</span>
                    <span className="font-medium">
                      {excessThousands} × $3.20 = ${formatCurrency(additionalPremium)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Base premium:</span>
                  <span className="font-medium">${formatCurrency(premiumPerUnit)}</span>
                </div>
              )}

              {/* Multiple units calculation */}
              {units > 1 && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Multiplied by {units} units:</span>
                  <span className="font-medium">${formatCurrency(premium)}</span>
                </div>
              )}
            </>
          )}

          {/* Final premium with GST breakdown */}
          <div className="pt-2 border-t space-y-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Net premium (excl. GST):</span>
              <span className="font-medium">{isBelowMinimum ? "$0.00" : `$${formatCurrency(premium / 1.1)}`}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">GST (10%):</span>
              <span className="font-medium">
                {isBelowMinimum ? "$0.00" : `$${formatCurrency(premium - premium / 1.1)}`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total premium (incl. GST):</span>
              <span className="text-xl sm:text-2xl font-bold">
                {isBelowMinimum ? "$0.00" : `$${formatCurrency(premium)}`}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="calculation-method">
          <AccordionTrigger>Premium Calculation Methodology</AccordionTrigger>
          <AccordionContent className="space-y-3 text-xs sm:text-sm">
            <div>
              <h4 className="font-semibold mb-1">Minimum Threshold</h4>
              <p>The minimum insurable value is $3,300. Any amount below this threshold results in a premium of $0.</p>
            </div>

            <div>
              <h4 className="font-semibold mb-1">Standard Calculation</h4>
              <p>
                For values between $3,300 and $3,000,000, premiums are calculated based on the QBCC premium table (July
                2020).
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-1">High-Value Calculation</h4>
              <p>For values exceeding $3,000,000, the premium is calculated as:</p>
              <ul className="list-disc list-inside pl-2 mt-1 space-y-1">
                <li>
                  <strong>New Construction:</strong> $20,671.45 + ($3.20 for every $1,000 over $3M)
                </li>
                <li>
                  <strong>Renovation:</strong> $14,490.25 + ($3.20 for every $1,000 over $3M)
                </li>
              </ul>
            </div>

            <div className="mt-2 pt-2 border-t">
              <p className="text-muted-foreground">All values are rounded up to the next $1,000 as per QBCC rules.</p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
