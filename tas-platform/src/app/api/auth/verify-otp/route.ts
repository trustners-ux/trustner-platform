import { NextResponse } from 'next/server'

// Deploy to Singapore region — closest to both India (user) and Sydney (Supabase)
export const runtime = 'nodejs'
export const preferredRegion = ['sin1']

// Server-side OTP verification
// Uses Supabase /auth/v1/verify which handles Twilio Verify check internally

export async function POST(request: Request) {
  const startTime = Date.now()

  try {
    const { phone, email, token, type } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'OTP code is required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    try {
      const body: Record<string, string> = { token, type: type || 'sms' }
      if (phone) body.phone = phone
      if (email) body.email = email

      const response = await fetch(`${supabaseUrl}/auth/v1/verify`, {
        method: 'POST',
        headers: {
          'apikey': anonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      const elapsed = Date.now() - startTime
      const text = await response.text()

      let data: Record<string, unknown> = {}
      try {
        data = JSON.parse(text)
      } catch {
        console.error(`[verify-otp] Parse error (${elapsed}ms):`, text.substring(0, 200))
        return NextResponse.json({ error: 'Unexpected response from auth server' }, { status: 500 })
      }

      if (!response.ok) {
        const errorMsg = (data.msg || data.message || data.error_description || 'Verification failed') as string
        console.log(`[verify-otp] Error (${elapsed}ms): ${errorMsg}`)
        return NextResponse.json({ error: errorMsg }, { status: response.status })
      }

      console.log(`[verify-otp] Success (${elapsed}ms) - has_token:${!!data.access_token}`)

      // Return session data — client will proceed without needing to contact Supabase
      return NextResponse.json({
        success: true,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        expires_at: data.expires_at,
        user: data.user,
      })
    } catch (fetchErr) {
      clearTimeout(timeout)
      const elapsed = Date.now() - startTime
      if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
        console.error(`[verify-otp] Timeout after ${elapsed}ms`)
        return NextResponse.json({ error: 'Verification timed out. Please try again.' }, { status: 504 })
      }
      throw fetchErr
    }
  } catch (err) {
    console.error('[verify-otp] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
