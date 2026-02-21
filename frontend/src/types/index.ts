export interface User {
  id: string
  email: string
  company_id: string | null
  is_super_admin: boolean
}

export interface Company {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface CompanyStats {
  company: Company
  total_feedback: number
  average_rating: number | null
  total_qr_codes: number
  active_qr_codes: number
}

export interface QRCode {
  id: string
  company_id: string
  uuid: string
  label: string
  is_active: boolean
  created_at: string
  image_base64?: string | null
}

export interface Feedback {
  id: string
  qr_code_id: string
  company_id: string
  rating: number
  comment: string | null
  ip_address: string | null
  created_at: string
  qr_label: string | null
}

export interface FeedbackStats {
  total: number
  average_rating: number | null
  distribution: Record<string, number>
}

export interface FeedbackHighlights {
  top3: Feedback[]
  worst3: Feedback[]
}

export interface TimelineEntry {
  label: string
  r1: number
  r2: number
  r3: number
  r4: number
  r5: number
  r6: number
  r7: number
  r8: number
  r9: number
  r10: number
}

export interface FeedbackTimeline {
  daily: TimelineEntry[]
  weekly: TimelineEntry[]
}

export interface QRCodePublicInfo {
  uuid: string
  label: string
  company_name: string
  is_active: boolean
}

export interface TokenResponse {
  access_token: string
  token_type: string
}
