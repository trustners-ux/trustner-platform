'use client'

import { useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth-store'

export function useAuth() {
  const { user, isLoading } = useAuthStore()

  const signInWithPhone = useCallback(async (phone: string) => {
    const supabase = createClient()
    const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`
    const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone })
    if (error) throw error
    return { success: true }
  }, [])

  const verifyPhoneOtp = useCallback(async (phone: string, otp: string) => {
    const supabase = createClient()
    const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`
    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: 'sms',
    })
    if (error) throw error
    return { success: true, user: data.user }
  }, [])

  const signInWithEmail = useCallback(async (email: string) => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) throw error
    return { success: true }
  }, [])

  const verifyEmailOtp = useCallback(async (email: string, otp: string) => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })
    if (error) throw error
    return { success: true, user: data.user }
  }, [])

  const updateProfile = useCallback(
    async (data: { name?: string; email?: string; city?: string }) => {
      if (!user) throw new Error('Not authenticated')

      const supabase = createClient()

      // Update Supabase auth user email if provided
      if (data.email) {
        await supabase.auth.updateUser({ email: data.email })
      }

      // Update profile in profiles table
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error
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
