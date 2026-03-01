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

  const signInWithPhone = useCallback(async (phone: string) => {
    const supabase = createClient()
    const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`

    const result = await Promise.race([
      supabase.auth.signInWithOtp({ phone: formattedPhone }),
      timeoutPromise(OTP_SEND_TIMEOUT, 'Sending OTP'),
    ])

    if (result.error) {
      const msg = result.error.message || ''
      if (msg.includes('rate limit') || msg.includes('too many')) {
        throw new Error('Too many attempts. Please wait a minute before trying again.')
      }
      if (msg.includes('not enabled') || msg.includes('provider')) {
        throw new Error('Phone verification is temporarily unavailable. Please use Email instead.')
      }
      throw result.error
    }

    return { success: true }
  }, [])

  const verifyPhoneOtp = useCallback(async (phone: string, otp: string) => {
    const supabase = createClient()
    const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`

    const result = await Promise.race([
      supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms',
      }),
      timeoutPromise(OTP_VERIFY_TIMEOUT, 'Verifying OTP'),
    ])

    if (result.error) {
      const msg = result.error.message || ''
      if (msg.includes('expired')) {
        throw new Error('OTP has expired. Please request a new one.')
      }
      if (msg.includes('invalid') || msg.includes('Token')) {
        throw new Error('Invalid OTP. Please check and try again.')
      }
      throw result.error
    }

    return { success: true, user: result.data.user }
  }, [])

  const signInWithEmail = useCallback(async (email: string) => {
    const supabase = createClient()

    const result = await Promise.race([
      supabase.auth.signInWithOtp({ email }),
      timeoutPromise(OTP_SEND_TIMEOUT, 'Sending OTP'),
    ])

    if (result.error) {
      const msg = result.error.message || ''
      if (msg.includes('rate limit') || msg.includes('too many')) {
        throw new Error('Too many attempts. Please wait a minute before trying again.')
      }
      throw result.error
    }

    return { success: true }
  }, [])

  const verifyEmailOtp = useCallback(async (email: string, otp: string) => {
    const supabase = createClient()

    const result = await Promise.race([
      supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      }),
      timeoutPromise(OTP_VERIFY_TIMEOUT, 'Verifying OTP'),
    ])

    if (result.error) {
      const msg = result.error.message || ''
      if (msg.includes('expired')) {
        throw new Error('OTP has expired. Please request a new one.')
      }
      if (msg.includes('invalid') || msg.includes('Token')) {
        throw new Error('Invalid OTP. Please check and try again.')
      }
      throw result.error
    }

    return { success: true, user: result.data.user }
  }, [])

  const updateProfile = useCallback(
    async (data: { name?: string; email?: string; city?: string }) => {
      if (!user) throw new Error('Not authenticated')

      const supabase = createClient()

      // Update Supabase auth user email if provided
      if (data.email) {
        await Promise.race([
          supabase.auth.updateUser({ email: data.email }),
          timeoutPromise(PROFILE_TIMEOUT, 'Updating profile'),
        ])
      }

      // Update profile in profiles table
      const result = await Promise.race([
        supabase
          .from('profiles')
          .upsert({
            id: user.id,
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id),
        timeoutPromise(PROFILE_TIMEOUT, 'Saving profile'),
      ])

      if (result.error) throw result.error
      return { success: true }
    },
    [user]
  )

  const signOut = useCallback(async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
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
