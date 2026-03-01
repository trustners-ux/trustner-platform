import { Resend } from 'resend'
import { buildReportEmailHTML } from './report-template'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendReportParams {
  to: string
  clientName: string
  overallScore: number
  pdfBuffer: Buffer
  planDate: string
}

export async function sendReportEmail(
  params: SendReportParams
): Promise<{ success: boolean; messageId?: string }> {
  try {
    const html = buildReportEmailHTML({
      clientName: params.clientName,
      overallScore: params.overallScore,
      planDate: params.planDate,
    })

    const { data, error } = await resend.emails.send({
      from: `Trustner Reports <${process.env.RESEND_FROM_EMAIL || 'reports@wealthyhub.in'}>`,
      to: params.to,
      subject: `Your Financial Plan Report — Trustner`,
      html,
      attachments: [
        {
          filename: `Trustner-Financial-Plan-${params.planDate}.pdf`,
          content: params.pdfBuffer,
        },
      ],
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false }
    }

    return { success: true, messageId: data?.id }
  } catch (err) {
    console.error('Email send error:', err)
    return { success: false }
  }
}
