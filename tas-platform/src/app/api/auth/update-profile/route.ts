import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Deploy to Singapore region — closest to both India (user) and Sydney (Supabase)
export const runtime = 'nodejs'
export const preferredRegion = ['sin1']

// Server-side profile update — avoids browser→Supabase connection issues

export async function POST(request: Request) {
  try {
    const { name, email, city } = await request.json()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    // Get the user's access token from cookies
    const cookieStore = await cookies()
    const supabaseRef = supabaseUrl.replace('https://', '').split('.')[0]
    const cookieBase = `sb-${supabaseRef}-auth-token`

    // Try to read session from cookies (single or chunked)
    let sessionStr = ''
    const singleCookie = cookieStore.get(cookieBase)
    if (singleCookie?.value) {
      const val = singleCookie.value
      sessionStr = val.startsWith('base64-')
        ? Buffer.from(val.slice(7), 'base64').toString('utf-8')
        : val
    } else {
      // Try chunked cookies
      let chunks = ''
      for (let i = 0; i < 10; i++) {
        const chunk = cookieStore.get(`${cookieBase}.${i}`)
        if (!chunk?.value) break
        const val = chunk.value
        chunks += val.startsWith('base64-') ? val.slice(7) : val
      }
      if (chunks) {
        sessionStr = Buffer.from(chunks, 'base64').toString('utf-8')
      }
    }

    if (!sessionStr) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    let session: { access_token: string; user?: { id: string } }
    try {
      session = JSON.parse(sessionStr)
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const userId = session.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'No user ID in session' }, { status: 401 })
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    try {
      // Update email in Supabase auth if provided
      if (email) {
        await fetch(`${supabaseUrl}/auth/v1/user`, {
          method: 'PUT',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
          signal: controller.signal,
        })
      }

      // Upsert profile in profiles table
      const profileData: Record<string, string> = {
        id: userId,
        updated_at: new Date().toISOString(),
      }
      if (name) profileData.name = name
      if (email) profileData.email = email
      if (city) profileData.city = city

      const profileResponse = await fetch(
        `${supabaseUrl}/rest/v1/profiles?on_conflict=id`,
        {
          method: 'POST',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify(profileData),
          signal: controller.signal,
        }
      )

      clearTimeout(timeout)

      if (!profileResponse.ok) {
        const err = await profileResponse.text()
        console.error('[update-profile] Error:', err)
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
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
    console.error('[update-profile] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
