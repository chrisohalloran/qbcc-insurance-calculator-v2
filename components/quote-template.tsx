import { RATE_REVIEWED, QBCC_SOURCE, QLEAVE_SOURCE, currency } from '@/lib/quote'
import { Text } from "@/components/catalyst/text"

interface QuoteTemplateProps {
  workType: string
  insurableValue: string // Formatted string e.g. "250,000"
  units: number
  premium: number
  qleave: number
  qleaveBasis?: number
  date?: Date
}

const AU_LOCALE = "en-AU"

export function QuoteTemplate({ 
  workType, 
  insurableValue, 
  units, 
  premium, 
  qleave, 
  qleaveBasis,
  date = new Date() 
}: QuoteTemplateProps) {
  return (
    <div className="p-5 sm:p-8 max-w-[210mm] mx-auto bg-white text-black h-full min-h-screen">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between items-start mb-12 border-b pb-6 border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-leva-navy mb-2">Estimate</h1>
            <p className="text-sm text-gray-500">QBCC Home Warranty Insurance & QLeave</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Generated via</div>
            <a href="https://www.qbccinsurancecalculator.com.au" className="text-sm font-medium text-leva-navy hover:underline">
              qbccinsurancecalculator.com.au
            </a>
            <div className="text-sm text-gray-500 mt-2">Date: {date.toLocaleDateString('en-AU', { timeZone: 'Australia/Brisbane' })}</div>
          </div>
        </div>

        <p className="mb-6 text-xs text-zinc-600"><a href={QBCC_SOURCE} className="underline">QBCC source</a> · <a href={QLEAVE_SOURCE} className="underline">QLeave source</a> · QLeave checked {RATE_REVIEWED}</p>
        {/* Project Details */}
        <div className="mb-12">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 border-b border-gray-100 pb-2">Project Details</h2>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-xs text-gray-500 mb-1">Work Type</p>
              <p className="font-medium text-lg capitalize">{workType.replace('-', ' ')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Insurable Value (Contract Price)</p>
              <p className="font-medium text-lg">${insurableValue || '0'}</p>
            </div>
            {units > 1 && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-1">Number of Units</p>
                <p className="font-medium text-lg">{units}</p>
              </div>
            )}
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="mb-12">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 border-b border-gray-100 pb-2">Cost Breakdown</h2>
          
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                <th className="pb-3 font-medium">Item</th>
                <th className="pb-3 font-medium">Rate / Note</th>
                <th className="pb-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-gray-100">
                <td className="py-4">QBCC Home Warranty Insurance</td>
                <td className="py-4 text-gray-500">QBCC table, effective 1 July 2020</td>
                <td className="py-4 text-right font-medium">
                  {`$${premium.toLocaleString(AU_LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-4">
                  QLeave Levy

                </td>
                <td className="py-4 text-gray-500">0.575% at $150,000 or more, excluding GST</td>
                <td className="py-4 text-right font-medium">
                  {`$${qleave.toLocaleString(AU_LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} className="pt-6 text-right font-bold text-gray-900">Estimated total</td>
                <td className="pt-6 text-right font-bold text-lg sm:text-2xl text-leva-navy whitespace-nowrap pl-3">
                  {`$${(premium + qleave).toLocaleString(AU_LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </td>
              </tr>
              <tr>
                <td colSpan={3} className="pt-2 text-right text-xs text-gray-500">Includes GST where applicable</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="mb-6 text-sm text-zinc-600">QLeave cost of work excluding GST: {currency(qleaveBasis ?? Number(insurableValue.replace(/,/g, '')) / 1.1)}. {units > 1 && 'Equal value per dwelling; confirm notional pricing eligibility with QBCC.'}</p>
        {/* Disclaimer */}
        <div className="mt-auto border-t border-gray-200 pt-8">
          <p className="text-xs text-gray-400 leading-relaxed text-center">
            This estimate is calculated using the official QBCC Premium Tables (effective 1 July 2020).
            While we strive for accuracy, please verify final amounts with the Queensland Building and Construction Commission (QBCC)
            and QLeave before payment.
          </p>
          <div className="flex justify-center items-center mt-6 gap-2">
             <span className="text-xs text-gray-400 uppercase tracking-widest">Powered by</span>
             <div className="text-sm font-bold text-leva-navy tracking-widest uppercase">
                LEV<span className="text-leva-orange">Λ</span>
             </div>
          </div>
        </div>
      </div>
  )
}
