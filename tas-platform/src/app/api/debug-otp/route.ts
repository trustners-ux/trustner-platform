import { NextResponse } from 'next/server'

// Temporary diagnostic endpoint to test Supabase OTP from server side
// DELETE THIS FILE AFTER DEBUGGING

export async function POST(request: Request) {
  const startTime = Date.now()
  const logs: string[] = []

  try {
    const { phone } = await request.json()
    logs.push(`[1] Phone: ${phone}`)
    logs.push(`[2] Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
    logs.push(`[3] Anon key present: ${!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`)
    logs.push(`[4] Anon key length: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length}`)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    // Test 1: Direct fetch to Supabase OTP endpoint
    logs.push(`[5] Making direct fetch to ${supabaseUrl}/auth/v1/otp`)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)

    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/otp`, {
        method: 'POST',
        headers: {
          'apikey': anonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      const elapsed = Date.now() - startTime
      logs.push(`[6] Response status: ${response.status}`)
      logs.push(`[7] Response time: ${elapsed}ms`)

      const text = await response.text()
      logs.push(`[8] Response body: ${text.substring(0, 500)}`)

      // Parse response
      let data
      try {
        data = JSON.parse(text)
      } catch {
        data = text
      }

      return NextResponse.json({
        success: response.ok,
        status: response.status,
        data,
        elapsed: `${elapsed}ms`,
        logs,
      })
    } catch (fetchErr) {
      clearTimeout(timeout)
      const elapsed = Date.now() - startTime
      logs.push(`[6] Fetch error: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`)
      logs.push(`[7] Elapsed: ${elapsed}ms`)

      return NextResponse.json({
        success: false,
        error: fetchErr instanceof Error ? fetchErr.message : String(fetchErr),
        elapsed: `${elapsed}ms`,
        logs,
      }, { status: 500 })
    }
  } catch (err) {
    logs.push(`[ERR] ${err instanceof Error ? err.message : String(err)}`)
    return NextResponse.json({ success: false, error: String(err), logs }, { status: 500 })
  }
}
