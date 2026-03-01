import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { FinancialPlan } from '@/types/financial-plan'

// POST /api/plans/[id]/email-report — Email PDF report to user
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

    // Parse optional email from request body
    let targetEmail: string | undefined
    try {
      const body = await request.json()
      targetEmail = body.email
    } catch {
      // Body may be empty, that is acceptable
    }

    // Determine email: body.email > profile.email > plan.personal contact
    if (!targetEmail) {
      // Try profile email
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single()

      targetEmail = profile?.email || undefined
    }

    if (!targetEmail) {
      // Try to extract from plan's personal data
      const { data: planRow } = await supabase
        .from('financial_plans')
        .select('plan_data')
        .eq('id', id)
        .single()

      if (planRow?.plan_data) {
        const planData = planRow.plan_data as Record<string, unknown>
        const personal = planData.personal as Record<string, unknown> | undefined
        if (personal?.email) {
          targetEmail = personal.email as string
        }
      }
    }

    // Fall back to user's auth email
    if (!targetEmail) {
      targetEmail = user.email
    }

    if (!targetEmail) {
      return NextResponse.json(
        { success: false, error: 'No email address available. Please provide an email.' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Check for existing report
    const { data: existingReport } = await supabase
      .from('plan_reports')
      .select('id, storage_path')
      .eq('plan_id', id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single()

    let storagePath: string
    let reportId: string

    if (existingReport) {
      storagePath = existingReport.storage_path
      reportId = existingReport.id
    } else {
      // Generate a new report
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

    // Download PDF buffer from storage for email attachment
    const { data: blob, error: downloadError } = await adminClient.storage
      .from('plan-reports')
      .download(storagePath)

    if (downloadError || !blob) {
      console.error('Storage download error:', downloadError)
      return NextResponse.json(
        { success: false, error: 'Failed to download report for emailing' },
        { status: 500 }
      )
    }

    const pdfArrayBuffer = await blob.arrayBuffer()
    const pdfBuffer = Buffer.from(pdfArrayBuffer)

    // Send email — this import may not exist yet, handle gracefully
    try {
      const { sendReportEmail } = await import('@/lib/email/send-report')
      await sendReportEmail({
        to: targetEmail,
        pdfBuffer,
        clientName: user.user_metadata?.name || 'User',
        overallScore: 0,
        planDate: new Date().toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }),
      })
    } catch (emailError) {
      console.error('Email sending failed:', emailError)
      return NextResponse.json(
        { success: false, error: 'Email service is not available yet' },
        { status: 501 }
      )
    }

    // Update report record with email info
    await supabase
      .from('plan_reports')
      .update({
        sent_to_email: targetEmail,
        sent_at: new Date().toISOString(),
      })
      .eq('id', reportId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/plans/[id]/email-report error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
