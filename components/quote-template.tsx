import { Text } from "@/components/catalyst/text"

interface QuoteTemplateProps {
  workType: string
  insurableValue: string // Formatted string e.g. "250,000"
  units: number
  premium: number
  qleave: number
  date?: Date
}

const AU_LOCALE = "en-AU"

export function QuoteTemplate({ 
  workType, 
  insurableValue, 
  units, 
  premium, 
  qleave, 
  date = new Date() 
}: QuoteTemplateProps) {
  return (
    <div className="p-8 max-w-[210mm] mx-auto bg-white text-black h-full min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-start mb-12 border-b pb-6 border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-leva-navy mb-2">Estimate</h1>
            <p className="text-sm text-gray-500">QBCC Home Warranty Insurance & QLeave</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Generated via</div>
            <a href="https://qbccinsurancecalculator.com.au" className="text-sm font-medium text-leva-navy hover:underline">
              qbccinsurancecalculator.com.au
            </a>
            <div className="text-sm text-gray-500 mt-2">Date: {date.toLocaleDateString()}</div>
          </div>
        </div>

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
                <td className="py-4 text-gray-500">Based on July 2020 Premium Table</td>
                <td className="py-4 text-right font-medium">
                  {`$${premium.toLocaleString(AU_LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-4">
                  QLeave Levy
                  <span className="ml-2 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 print:hidden">
                    ✓ Verified Live
                  </span>
                </td>
                <td className="py-4 text-gray-500">0.575% (Applicable if &gt;$150k ex GST)</td>
                <td className="py-4 text-right font-medium">
                  {`$${qleave.toLocaleString(AU_LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} className="pt-6 text-right font-bold text-gray-900">Total Estimated Payable</td>
                <td className="pt-6 text-right font-bold text-2xl text-leva-navy">
                  {`$${(premium + qleave).toLocaleString(AU_LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </td>
              </tr>
              <tr>
                <td colSpan={3} className="pt-2 text-right text-xs text-gray-500">Includes GST where applicable</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Disclaimer */}
        <div className="mt-auto border-t border-gray-200 pt-8">
          <p className="text-xs text-gray-400 leading-relaxed text-center">
            This estimate is calculated using the official QBCC Premium Tables (July 2020). 
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
