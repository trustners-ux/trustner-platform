export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface SavePlanResponse {
  planId: string
}

export interface PlanReportResponse {
  reportId: string
  downloadUrl: string
}

export interface LeadRecord {
  user_id: string
  name: string | null
  phone: string | null
  email: string | null
  city: string | null
  signup_date: string
  plan_id: string | null
  overall_score: number | null
  is_complete: boolean | null
  plan_date: string | null
  report_generated: boolean
  report_emailed: boolean
  report_downloaded: boolean
}

export interface LeadsResponse {
  leads: LeadRecord[]
  total: number
  page: number
  limit: number
}
