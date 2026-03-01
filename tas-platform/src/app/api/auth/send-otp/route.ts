import { NextResponse } from 'next/server'

// Deploy to Singapore region — closest to both India (user) and Sydney (Supabase)
export const runtime = 'nodejs'
export const preferredRegion = ['sin1']

// Server-side OTP sending — bypasses browser-to-Supabase connection issues

export async function POST(request: Request) {
  try {
    const { phone, email, method } = await request.json()

    if (method === 'phone' && !phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }
    if (method === 'email' && !email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    // Use anon key (not service role) to go through the normal OTP flow
    // This triggers Twilio Verify for phone OTP
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)

    try {
      const body = method === 'phone' ? { phone } : { email }

      const response = await fetch(`${supabaseUrl}/auth/v1/otp`, {
        method: 'POST',
        headers: {
          'apikey': anonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMsg = errorData.msg || errorData.message || errorData.error_description || 'Failed to send OTP'
        return NextResponse.json({ error: errorMsg }, { status: response.status })
      }

      return NextResponse.json({ success: true })
    } catch (fetchErr) {
      clearTimeout(timeout)
      if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
        return NextResponse.json({ error: 'Request timed out' }, { status: 504 })
      }
      throw fetchErr
    }
  } catch (err) {
    console.error('[send-otp] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
