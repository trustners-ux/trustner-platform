import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { FinancialPlan } from '@/types/financial-plan'

// POST /api/plans/[id]/report — Generate a PDF report for a plan
export async function POST(
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

    // Fetch the plan from the database
    const { data: planRow, error: fetchError } = await supabase
      .from('financial_plans')
      .select('id, plan_data, analysis')
      .eq('id', id)
      .single()

    if (fetchError || !planRow) {
      return NextResponse.json(
        { success: false, error: 'Plan not found' },
        { status: 404 }
      )
    }

    // Reconstruct the full plan
    const plan: FinancialPlan = {
      ...(planRow.plan_data as Omit<FinancialPlan, 'analysis'>),
      analysis: planRow.analysis as FinancialPlan['analysis'],
    }

    // Generate PDF — this import may not exist yet, handle gracefully
    let pdfBuffer: Buffer
    try {
      const { generatePlanPDF } = await import('@/lib/pdf/generate-pdf')
      pdfBuffer = await generatePlanPDF(plan)
    } catch (pdfError) {
      console.error('PDF generation failed:', pdfError)
      return NextResponse.json(
        { success: false, error: 'PDF generation is not available yet' },
        { status: 501 }
      )
    }

    // Upload to Supabase Storage using admin client (bypasses RLS)
    const adminClient = createAdminClient()
    const storagePath = `${user.id}/${id}/report-${Date.now()}.pdf`

    const { error: uploadError } = await adminClient.storage
      .from('plan-reports')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { success: false, error: 'Failed to upload report' },
        { status: 500 }
      )
    }

    // Create signed URL (valid for 7 days)
    const { data: signedUrlData, error: signedUrlError } = await adminClient.storage
      .from('plan-reports')
      .createSignedUrl(storagePath, 7 * 24 * 60 * 60)

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Signed URL error:', signedUrlError)
      return NextResponse.json(
        { success: false, error: 'Failed to create download URL' },
        { status: 500 }
      )
    }

    // Insert report record into plan_reports table
    const { data: report, error: reportError } = await supabase
      .from('plan_reports')
      .insert({
        plan_id: id,
        user_id: user.id,
        storage_path: storagePath,
        download_url: signedUrlData.signedUrl,
        generated_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (reportError) {
      console.error('Report record insert error:', reportError)
      return NextResponse.json(
        { success: false, error: 'Failed to save report record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        reportId: report.id,
        downloadUrl: signedUrlData.signedUrl,
      },
    })
  } catch (error) {
    console.error('POST /api/plans/[id]/report error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
