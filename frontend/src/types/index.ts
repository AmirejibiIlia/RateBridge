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
  logo_base64: string | null
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
  logo_base64: string | null
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface PartnershipRequest {
  id: string
  company_name: string
  email: string
  phone: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export interface Employee {
  id: string
  company_id: string
  name: string
  role: string | null
  created_at: string
}

export type TaskStatus = 'backlog' | 'in_progress' | 'resolved' | 'rejected'

export interface Task {
  id: string
  company_id: string
  title: string
  description: string | null
  status: TaskStatus
  assigned_to_id: string | null
  assigned_to_name: string | null
  created_at: string
  updated_at: string
}

export interface TaskStats {
  total: number
  backlog: number
  in_progress: number
  resolved: number
  rejected: number
}
