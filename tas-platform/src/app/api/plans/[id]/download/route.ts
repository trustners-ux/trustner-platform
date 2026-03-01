import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { FinancialPlan } from '@/types/financial-plan'

// GET /api/plans/[id]/download — Download PDF report for a plan
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

    const adminClient = createAdminClient()

    // Fetch the latest report for this plan
    const { data: report } = await supabase
      .from('plan_reports')
      .select('id, storage_path')
      .eq('plan_id', id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single()

    let storagePath: string
    let reportId: string

    if (report) {
      // Use existing report
      storagePath = report.storage_path
      reportId = report.id
    } else {
      // No report exists — generate one on the fly
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

      const plan: FinancialPlan = {
        ...(planRow.plan_data as Omit<FinancialPlan, 'analysis'>),
        analysis: planRow.analysis as FinancialPlan['analysis'],
      }

      // Generate PDF
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

      // Upload to storage
      storagePath = `${user.id}/${id}/report-${Date.now()}.pdf`

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

      // Insert report record
      const { data: newReport, error: reportInsertError } = await supabase
        .from('plan_reports')
        .insert({
          plan_id: id,
          user_id: user.id,
          storage_path: storagePath,
          generated_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (reportInsertError || !newReport) {
        console.error('Report record insert error:', reportInsertError)
        return NextResponse.json(
          { success: false, error: 'Failed to save report record' },
          { status: 500 }
        )
      }

      reportId = newReport.id
    }

    // Download from Supabase Storage
    const { data: blob, error: downloadError } = await adminClient.storage
      .from('plan-reports')
      .download(storagePath)

    if (downloadError || !blob) {
      console.error('Storage download error:', downloadError)
      return NextResponse.json(
        { success: false, error: 'Failed to download report file' },
        { status: 500 }
      )
    }

    // Update downloaded_at timestamp
    await supabase
      .from('plan_reports')
      .update({ downloaded_at: new Date().toISOString() })
      .eq('id', reportId)

    // Return raw PDF as a downloadable response
    const arrayBuffer = await blob.arrayBuffer()

    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Trustner-Financial-Plan.pdf"',
      },
    })
  } catch (error) {
    console.error('GET /api/plans/[id]/download error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
