'use client'

import { useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth-store'

// ---------------------------------------------------------------------------
// Timeout wrapper — prevents hanging "Sending..." state
// ---------------------------------------------------------------------------

function timeoutPromise(ms: number, label: string): Promise<never> {
  return new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${label} timed out. Please check your connection and try again.`))
    }, ms)
  })
}

const OTP_SEND_TIMEOUT = 15_000 // 15 seconds
const OTP_VERIFY_TIMEOUT = 15_000 // 15 seconds
const PROFILE_TIMEOUT = 10_000 // 10 seconds

export function useAuth() {
  const { user, isLoading } = useAuthStore()

  // -------------------------------------------------------------------------
  // Send OTP — uses server-side API route to avoid browser→Supabase issues
  // -------------------------------------------------------------------------
  const signInWithPhone = useCallback(async (phone: string) => {
    const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`

    console.log('[useAuth] signInWithPhone called with:', formattedPhone)

    const response = await Promise.race([
      fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone, method: 'phone' }),
      }),
      timeoutPromise(OTP_SEND_TIMEOUT, 'Sending OTP'),
    ])

    const data = await response.json()
    console.log('[useAuth] send-otp response:', response.status, JSON.stringify(data))

    if (!response.ok || data.error) {
      const msg = data.error || 'Failed to send OTP'
      console.error('[useAuth] OTP send error:', msg)
      if (msg.includes('rate limit') || msg.includes('too many') || msg.includes('Rate limit')) {
        throw new Error('Too many attempts. Please wait a minute before trying again.')
      }
      if (msg.includes('not enabled') || msg.includes('provider')) {
        throw new Error('Phone verification is temporarily unavailable. Please use Email instead.')
      }
      throw new Error(msg)
    }

    console.log('[useAuth] signInWithPhone SUCCESS')
    return { success: true }
  }, [])

  // -------------------------------------------------------------------------
  // Verify Phone OTP — uses server-side route, then sets session locally
  // -------------------------------------------------------------------------
  const verifyPhoneOtp = useCallback(async (phone: string, otp: string) => {
    const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`

    console.log('[useAuth] verifyPhoneOtp called')

    const response = await Promise.race([
      fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone, token: otp, type: 'sms' }),
      }),
      timeoutPromise(OTP_VERIFY_TIMEOUT, 'Verifying OTP'),
    ])

    const data = await response.json()
    console.log('[useAuth] verify-otp response:', response.status, data.success)

    if (!response.ok || data.error) {
      const msg = data.error || 'Verification failed'
      if (msg.includes('expired') || msg.includes('Expired')) {
        throw new Error('OTP has expired. Please request a new one.')
      }
      if (msg.includes('invalid') || msg.includes('Token') || msg.includes('Invalid')) {
        throw new Error('Invalid OTP. Please check and try again.')
      }
      throw new Error(msg)
    }

    // Session cookies are set by the server-side verify-otp route directly
    // No need to call supabase.auth.setSession() from the browser
    console.log('[useAuth] Phone OTP verified, session cookies set by server')

    return { success: true, user: data.user }
  }, [])

  // -------------------------------------------------------------------------
  // Send Email OTP — uses server-side route
  // -------------------------------------------------------------------------
  const signInWithEmail = useCallback(async (email: string) => {
    console.log('[useAuth] signInWithEmail called with:', email)

    const response = await Promise.race([
      fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, method: 'email' }),
      }),
      timeoutPromise(OTP_SEND_TIMEOUT, 'Sending OTP'),
    ])

    const data = await response.json()
    console.log('[useAuth] send-otp (email) response:', response.status, JSON.stringify(data))

    if (!response.ok || data.error) {
      const msg = data.error || 'Failed to send OTP'
      if (msg.includes('rate limit') || msg.includes('too many') || msg.includes('Rate limit')) {
        throw new Error('Too many attempts. Please wait a minute before trying again.')
      }
      throw new Error(msg)
    }

    console.log('[useAuth] signInWithEmail SUCCESS')
    return { success: true }
  }, [])

  // -------------------------------------------------------------------------
  // Verify Email OTP — uses server-side route, then sets session locally
  // -------------------------------------------------------------------------
  const verifyEmailOtp = useCallback(async (email: string, otp: string) => {
    console.log('[useAuth] verifyEmailOtp called')

    const response = await Promise.race([
      fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: otp, type: 'email' }),
      }),
      timeoutPromise(OTP_VERIFY_TIMEOUT, 'Verifying OTP'),
    ])

    const data = await response.json()
    console.log('[useAuth] verify-otp (email) response:', response.status, data.success)

    if (!response.ok || data.error) {
      const msg = data.error || 'Verification failed'
      if (msg.includes('expired') || msg.includes('Expired')) {
        throw new Error('OTP has expired. Please request a new one.')
      }
      if (msg.includes('invalid') || msg.includes('Token') || msg.includes('Invalid')) {
        throw new Error('Invalid OTP. Please check and try again.')
      }
      throw new Error(msg)
    }

    // Session cookies are set by the server-side verify-otp route directly
    console.log('[useAuth] Email OTP verified, session cookies set by server')

    return { success: true, user: data.user }
  }, [])

  // -------------------------------------------------------------------------
  // Update profile — uses server-side route to avoid browser→Supabase issues
  // -------------------------------------------------------------------------
  const updateProfile = useCallback(
    async (data: { name?: string; email?: string; city?: string }) => {
      console.log('[useAuth] updateProfile called:', data)

      const response = await Promise.race([
        fetch('/api/auth/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }),
        timeoutPromise(PROFILE_TIMEOUT, 'Saving profile'),
      ])

      const result = await response.json()
      console.log('[useAuth] updateProfile response:', response.status, result)

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to update profile')
      }

      return { success: true }
    },
    []
  )

  const signOut = useCallback(async () => {
    // Clear auth cookies by calling a simple endpoint or just clearing locally
    try {
      const supabase = createClient()
      await Promise.race([
        supabase.auth.signOut(),
        timeoutPromise(3000, 'Signing out'),
      ])
    } catch {
      // If signOut hangs, just clear cookies manually
      document.cookie.split(';').forEach((c) => {
        const name = c.trim().split('=')[0]
        if (name.startsWith('sb-')) {
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
        }
      })
    }
  }, [])

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signInWithPhone,
    verifyPhoneOtp,
    signInWithEmail,
    verifyEmailOtp,
    updateProfile,
    signOut,
  }
}
