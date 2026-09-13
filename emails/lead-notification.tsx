import { escapeHtml } from './escape-html'
import { LeadCaptureData } from '@/lib/types'

function formatCurrency(amount: number) {
  return amount.toLocaleString('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
  })
}

export function buildLeadNotificationHtml(lead: LeadCaptureData) {
  return `
<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;">
      <tr><td style="padding:18px 20px;background:#18181b;color:#fff;"><h2 style="margin:0;font-size:20px;">New QBCC Lead Captured</h2></td></tr>
      <tr><td style="padding:20px;">
        <p style="margin-top:0;"><strong>Lead Reference:</strong> ${escapeHtml(lead.leadReference)}</p>
        <p><strong>Review Status:</strong> ${escapeHtml(lead.reviewStatus)}</p>
        <p><strong>Email:</strong> ${escapeHtml(lead.email)}</p>
        <p><strong>Name:</strong> ${escapeHtml(lead.name || 'Not provided')}</p>
        <p><strong>Phone:</strong> ${escapeHtml(lead.phone || 'Not provided')}</p>
        <p><strong>Source:</strong> ${escapeHtml(lead.source)}</p>
        <p><strong>Capture Trigger:</strong> ${escapeHtml(lead.analytics?.leadCaptureTrigger || 'Not provided')}</p>
        <hr style="border:0;border-top:1px solid #e4e4e7;margin:16px 0;" />
        <h3 style="margin-bottom:10px;">Quote Details</h3>
        <p style="margin:6px 0;"><strong>Work Type:</strong> ${escapeHtml(lead.quoteData.workType || 'Not provided')}</p>
        <p style="margin:6px 0;"><strong>Insurable Value:</strong> ${escapeHtml(formatCurrency(lead.quoteData.insurableValue || 0))}</p>
        <p style="margin:6px 0;"><strong>Units:</strong> ${escapeHtml(lead.quoteData.units || 1)}</p>
        <p style="margin:6px 0;"><strong>QBCC Premium:</strong> ${escapeHtml(formatCurrency(lead.quoteData.premium || 0))}</p>
        <p style="margin:6px 0;"><strong>QLeave Levy:</strong> ${escapeHtml(formatCurrency(lead.quoteData.qleave || 0))}</p>
        <p style="margin:6px 0;"><strong>Total:</strong> ${escapeHtml(formatCurrency(lead.quoteData.total || 0))}</p>
      </td></tr>
    </table>
  </body>
</html>`
}
