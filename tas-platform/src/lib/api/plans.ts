import type { FinancialPlan } from '@/types/financial-plan'
import type { ApiResponse, SavePlanResponse, PlanReportResponse } from '@/types/api'

export async function savePlan(plan: FinancialPlan): Promise<SavePlanResponse> {
  const res = await fetch('/api/plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan }),
  })

  const data: ApiResponse<SavePlanResponse> = await res.json()
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to save plan')
  return data.data
}

export async function getLatestPlan(): Promise<FinancialPlan | null> {
  const res = await fetch('/api/plans')
  const data: ApiResponse<{ plan: FinancialPlan }> = await res.json()
  if (!data.success) return null
  return data.data?.plan ?? null
}

export async function getPlan(id: string): Promise<FinancialPlan | null> {
  const res = await fetch(`/api/plans/${id}`)
  const data: ApiResponse<{ plan: FinancialPlan }> = await res.json()
  if (!data.success) return null
  return data.data?.plan ?? null
}

export async function generateReport(planId: string): Promise<PlanReportResponse> {
  const res = await fetch(`/api/plans/${planId}/report`, {
    method: 'POST',
  })

  const data: ApiResponse<PlanReportResponse> = await res.json()
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to generate report')
  return data.data
}

export async function emailReport(
  planId: string,
  email?: string
): Promise<{ success: boolean }> {
  const res = await fetch(`/api/plans/${planId}/email-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  const data: ApiResponse = await res.json()
  if (!data.success) throw new Error(data.error || 'Failed to email report')
  return { success: true }
}

export async function downloadReport(planId: string): Promise<Blob> {
  const res = await fetch(`/api/plans/${planId}/download`)
  if (!res.ok) throw new Error('Failed to download report')
  return res.blob()
}
