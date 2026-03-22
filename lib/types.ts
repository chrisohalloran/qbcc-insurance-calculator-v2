export interface LeadCaptureData {
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
  timestamp: string
  source: 'post-calculation' | 'pre-calculation' | 'rate-notification' | 'lodge_waitlist'
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
  source: 'post-calculation' | 'pre-calculation' | 'rate-notification' | 'lodge_waitlist'
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}