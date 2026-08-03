export type LeadCaptureTrigger = 'auto_after_calculation' | 'email_quote_button' | 'contextual_offer' | 'estimate_page'
export type LeadReviewStatus = 'pending_review'

export interface LeadCaptureData {
  leadReference: string
  reviewStatus: LeadReviewStatus
  email: string
  name?: string
  phone?: string
  quoteData: {
    workType: string
    insurableValue: number
    units: number
    premium: number
    qleave: number
    total: number
  }
  analytics?: {
    valueBand?: string
    projectSegment?: string
    qleaveApplicable?: boolean
    recommendedOfferId?: string
    recommendedOfferPartner?: string
    leadCaptureTrigger?: LeadCaptureTrigger
  }
  timestamp: string
  source: 'post-calculation' | 'pre-calculation' | 'rate-notification' | 'lodge_waitlist' | 'draft_prep_waitlist'
}

export interface LeadCaptureRequest {
  email: string
  name?: string
  phone?: string
  workType?: string
  insurableValue?: number
  units?: number
  premium?: number
  qleave?: number
  valueBand?: string
  projectSegment?: string
  qleaveApplicable?: boolean
  recommendedOfferId?: string
  recommendedOfferPartner?: string
  leadCaptureTrigger?: LeadCaptureTrigger
  source: 'post-calculation' | 'pre-calculation' | 'rate-notification' | 'lodge_waitlist' | 'draft_prep_waitlist'
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}
