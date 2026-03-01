import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { FinancialPlan } from '@/types/financial-plan'

// GET /api/plans/[id] — Get a specific plan by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: planRow, error: fetchError } = await supabase
      .from('financial_plans')
      .select('id, plan_data, analysis, created_at, updated_at')
      .eq('id', id)
      .single()

    if (fetchError || !planRow) {
      return NextResponse.json(
        { success: false, error: 'Plan not found' },
        { status: 404 }
      )
    }

    // Reconstruct full FinancialPlan from plan_data + analysis
    const plan: FinancialPlan = {
      ...(planRow.plan_data as Omit<FinancialPlan, 'analysis'>),
      analysis: planRow.analysis as FinancialPlan['analysis'],
    }

    return NextResponse.json({
      success: true,
      data: { plan, planId: planRow.id },
    })
  } catch (error) {
    console.error('GET /api/plans/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
