import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface ContactSubmission {
  name: string
  phone: string
  email?: string
  city?: string
  topic?: string
  message?: string
}

// POST /api/contact — Public contact form submission
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ContactSubmission>

    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      )
    }

    if (!body.phone || typeof body.phone !== 'string' || body.phone.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Basic phone validation (Indian numbers: 10 digits, optionally prefixed with +91)
    const phoneClean = body.phone.replace(/[\s\-()]/g, '')
    if (!/^(\+91)?[6-9]\d{9}$/.test(phoneClean)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid Indian phone number' },
        { status: 400 }
      )
    }

    // Basic email validation if provided
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Insert into contact_submissions table
    const { error: insertError } = await supabase
      .from('contact_submissions')
      .insert({
        name: body.name.trim(),
        phone: phoneClean,
        email: body.email?.trim() || null,
        city: body.city?.trim() || null,
        topic: body.topic?.trim() || null,
        message: body.message?.trim() || null,
        created_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error('Contact submission insert error:', insertError)
      return NextResponse.json(
        { success: false, error: 'Failed to submit contact form' },
        { status: 500 }
      )
    }

    // Optionally send notification email to the team
    try {
      if (process.env.RESEND_API_KEY) {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)

        await resend.emails.send({
          from: `Trustner Notifications <${process.env.RESEND_FROM_EMAIL || 'notifications@wealthyhub.in'}>`,
          to: 'wecare@wealthyhub.in',
          subject: `New Contact: ${body.name.trim()} — ${body.topic || 'General'}`,
          html: `
            <h3>New Contact Form Submission</h3>
            <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
              <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Name</td><td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(body.name.trim())}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Phone</td><td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(phoneClean)}</td></tr>
              ${body.email ? `<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Email</td><td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(body.email)}</td></tr>` : ''}
              ${body.city ? `<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">City</td><td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(body.city)}</td></tr>` : ''}
              ${body.topic ? `<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Topic</td><td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(body.topic)}</td></tr>` : ''}
              ${body.message ? `<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Message</td><td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(body.message)}</td></tr>` : ''}
            </table>
            <p style="color: #888; font-size: 12px; margin-top: 16px;">Submitted at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
          `,
        })
      }
    } catch (emailErr) {
      // Email notification failure should not block the response
      console.error('Contact notification email error:', emailErr)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/contact error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Escape HTML special characters to prevent XSS.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
