import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { FinancialPlan } from '@/types/financial-plan'

// POST /api/plans — Save a financial plan (upsert)
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const plan: FinancialPlan = body.plan

    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Missing plan data' },
        { status: 400 }
      )
    }

    // Separate analysis from the rest of the plan data
    const { analysis, ...planData } = plan

    // Check if the user already has a saved plan
    const { data: existingPlan } = await supabase
      .from('financial_plans')
      .select('id')
      .eq('user_id', user.id)
      .single()

    let planId: string

    if (existingPlan) {
      // UPDATE existing plan
      const { data: updated, error: updateError } = await supabase
        .from('financial_plans')
        .update({
          plan_data: planData,
          analysis: analysis,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPlan.id)
        .eq('user_id', user.id)
        .select('id')
        .single()

      if (updateError) {
        console.error('Error updating plan:', updateError)
        return NextResponse.json(
          { success: false, error: 'Failed to update plan' },
          { status: 500 }
        )
      }

      planId = updated.id
    } else {
      // INSERT new plan
      const { data: inserted, error: insertError } = await supabase
        .from('financial_plans')
        .insert({
          user_id: user.id,
          plan_data: planData,
          analysis: analysis,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('Error inserting plan:', insertError)
        return NextResponse.json(
          { success: false, error: 'Failed to save plan' },
          { status: 500 }
        )
      }

      planId = inserted.id
    }

    // Update profile with name/city from plan.personal if available
    if (plan.personal) {
      const profileUpdate: Record<string, string> = {}
      if (plan.personal.name) profileUpdate.name = plan.personal.name
      if (plan.personal.city) profileUpdate.city = plan.personal.city

      if (Object.keys(profileUpdate).length > 0) {
        await supabase
          .from('profiles')
          .update(profileUpdate)
          .eq('id', user.id)
      }
    }

    return NextResponse.json({ success: true, data: { planId } })
  } catch (error) {
    console.error('POST /api/plans error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/plans — Get user's latest plan
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: planRow, error: fetchError } = await supabase
      .from('financial_plans')
      .select('id, plan_data, analysis, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError || !planRow) {
      // No plan found is not an error — return null
      return NextResponse.json({ success: true, data: { plan: null, planId: null } })
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
    console.error('GET /api/plans error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
