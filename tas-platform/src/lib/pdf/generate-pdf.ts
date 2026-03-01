import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import PlanReportPDF from './PlanReportPDF'
import type { FinancialPlan } from '@/types/financial-plan'

export async function generatePlanPDF(plan: FinancialPlan): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(PlanReportPDF, { plan }) as any
  const buffer = await renderToBuffer(element)
  return Buffer.from(buffer)
}
