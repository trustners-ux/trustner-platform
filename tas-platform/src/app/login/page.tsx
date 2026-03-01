'use client'

import { Suspense, useState, useRef, useEffect, useCallback, type KeyboardEvent, type ChangeEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  Phone,
  Mail,
  ArrowRight,
  Shield,
  CheckCircle,
  Loader2,
} from 'lucide-react'
import { REGULATORY } from '@/lib/constants/regulatory'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AuthMethod = 'phone' | 'email'
type Step = 1 | 2 | 3 | 4

// ---------------------------------------------------------------------------
// Animation
// ---------------------------------------------------------------------------

const shakeVariants = {
  shake: { x: [0, -8, 8, -6, 6, -3, 3, 0], transition: { duration: 0.5 } },
  idle: { x: 0 },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function maskPhone(phone: string): string {
  if (phone.length < 4) return phone
  return phone.slice(0, 2) + 'XXXXXX' + phone.slice(-2)
}

function maskEmail(emailAddr: string): string {
  const [local, domain] = emailAddr.split('@')
  if (!domain) return emailAddr
  const masked = local.length > 2 ? local.slice(0, 2) + '***' : local + '***'
  return `${masked}@${domain}`
}

function isValidPhone(value: string): boolean {
  return /^\d{10}$/.test(value)
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

// ---------------------------------------------------------------------------
// OTP Input sub-component
// ---------------------------------------------------------------------------

interface OtpInputProps {
  value: string[]
  onChange: (otp: string[]) => void
  onComplete: (otp: string) => void
  disabled?: boolean
}

function OtpInput({ value, onChange, onComplete, disabled }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = useCallback(
    (index: number, e: ChangeEvent<HTMLInputElement>) => {
      const char = e.target.value.replace(/\D/g, '').slice(-1)
      const next = [...value]
      next[index] = char
      onChange(next)

      if (char && index < 5) {
        refs.current[index + 1]?.focus()
      }
      if (next.every((d) => d.length === 1)) {
        onComplete(next.join(''))
      }
    },
    [value, onChange, onComplete],
  )

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !value[index] && index > 0) {
        const next = [...value]
        next[index - 1] = ''
        onChange(next)
        refs.current[index - 1]?.focus()
      }
    },
    [value, onChange],
  )

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault()
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
      if (!pasted) return
      const next = [...value]
      for (let i = 0; i < 6; i++) {
        next[i] = pasted[i] || ''
      }
      onChange(next)
      const focusIdx = Math.min(pasted.length, 5)
      refs.current[focusIdx]?.focus()
      if (next.every((d) => d.length === 1)) {
        onComplete(next.join(''))
      }
    },
    [value, onChange, onComplete],
  )

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          className="h-12 w-10 rounded-lg border border-gray-200 bg-gray-50 text-center text-lg font-bold text-gray-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:opacity-50 sm:h-14 sm:w-12"
          autoFocus={i === 0}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Login Page
// ---------------------------------------------------------------------------

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A1628] via-[#1a2d4a] to-[#0A1628]">
        <div className="animate-pulse text-white/60 text-sm">Loading...</div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const auth = useAuth()

  // Redirect destination after login
  const redirectTo = searchParams.get('redirect') || '/dashboard'
  const fromPlanner = redirectTo.includes('ai-planner')

  // ---- Redirect if already authenticated ----
  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated) {
      router.replace(redirectTo)
    }
  }, [auth.isLoading, auth.isAuthenticated, router, redirectTo])

  // ---- State ----
  const [step, setStep] = useState<Step>(1)
  const [method, setMethod] = useState<AuthMethod>('phone')

  // Step 1
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  // Step 2
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))

  // Step 3
  const [reportEmail, setReportEmail] = useState('')

  // Step 4
  const [name, setName] = useState('')

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasError, setHasError] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)

  // ---- Resend countdown ----
  useEffect(() => {
    if (resendCountdown <= 0) return
    const timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCountdown])

  // ---- Helpers ----
  const triggerError = useCallback((msg: string) => {
    setError(msg)
    setHasError(true)
    setTimeout(() => setHasError(false), 600)
  }, [])

  // ---- Step 1: Send OTP ----
  const handleSendOtp = useCallback(async () => {
    setError('')

    // Validate before setting loading state
    if (method === 'phone' && !isValidPhone(phone)) {
      triggerError('Please enter a valid 10-digit phone number.')
      return
    }
    if (method === 'email' && !isValidEmail(email)) {
      triggerError('Please enter a valid email address.')
      return
    }

    setLoading(true)
    try {
      if (method === 'phone') {
        await auth.signInWithPhone(phone)
      } else {
        await auth.signInWithEmail(email)
      }
      setResendCountdown(30)
      setStep(2)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send OTP. Please try again.'
      triggerError(message)
    } finally {
      setLoading(false)
    }
  }, [method, phone, email, auth, triggerError])

  // ---- Step 2: Verify OTP ----
  const handleVerifyOtp = useCallback(
    async (code: string) => {
      setError('')
      setLoading(true)
      try {
        if (method === 'phone') {
          await auth.verifyPhoneOtp(phone, code)
        } else {
          await auth.verifyEmailOtp(email, code)
        }
        // Email flow skips step 3 (already have email)
        if (method === 'email') {
          setStep(4)
        } else {
          setStep(3)
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Wrong OTP? Try again.'
        triggerError(message)
        setOtp(Array(6).fill(''))
      } finally {
        setLoading(false)
      }
    },
    [method, phone, email, auth, triggerError],
  )

  // ---- Step 2: Resend OTP ----
  const handleResendOtp = useCallback(async () => {
    if (resendCountdown > 0) return
    setError('')
    setLoading(true)
    try {
      if (method === 'phone') {
        await auth.signInWithPhone(phone)
      } else {
        await auth.signInWithEmail(email)
      }
      setResendCountdown(30)
      setOtp(Array(6).fill(''))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Too many attempts. Please wait a moment.'
      triggerError(message)
    } finally {
      setLoading(false)
    }
  }, [resendCountdown, method, phone, email, auth, triggerError])

  // ---- Step 3: Save email ----
  const handleSaveEmail = useCallback(async () => {
    setError('')
    if (!isValidEmail(reportEmail)) {
      triggerError('Please enter a valid email address.')
      return
    }
    setLoading(true)
    try {
      await auth.updateProfile({ email: reportEmail })
      setStep(4)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save email.'
      triggerError(message)
    } finally {
      setLoading(false)
    }
  }, [reportEmail, auth, triggerError])

  // ---- Step 4: Confirm name & redirect ----
  const handleFinish = useCallback(async () => {
    setError('')
    if (!name.trim()) {
      triggerError('Please enter your name.')
      return
    }
    setLoading(true)
    try {
      await auth.updateProfile({ name: name.trim() })
      router.replace(redirectTo)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong.'
      triggerError(message)
    } finally {
      setLoading(false)
    }
  }, [name, auth, router, redirectTo, triggerError])

  // ---- Switch methods ----
  const switchToEmail = useCallback(() => {
    setMethod('email')
    setError('')
    setPhone('')
  }, [])

  const switchToPhone = useCallback(() => {
    setMethod('phone')
    setError('')
    setEmail('')
  }, [])

  const goBackToStep1 = useCallback(() => {
    setStep(1)
    setOtp(Array(6).fill(''))
    setError('')
    setResendCountdown(0)
  }, [])

  // ---- Computed ----
  const canSendOtp = method === 'phone' ? isValidPhone(phone) : isValidEmail(email)

  // ---- If loading auth state, show spinner ----
  if (auth.isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-violet-600" />
      </div>
    )
  }

  // If already authenticated the useEffect above handles redirect;
  // show nothing while redirecting
  if (auth.isAuthenticated) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-violet-600" />
      </div>
    )
  }

  // ---- Step progress ----
  const totalSteps = method === 'email' ? 3 : 4
  const mappedStep = method === 'email' && step === 4 ? 3 : step

  // ---------------------------------------------------------------------------
  // Step renderers
  // ---------------------------------------------------------------------------

  const renderStep1 = () => (
    <div className="space-y-5">
      {/* Input */}
      {method === 'phone' ? (
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">Mobile Number</label>
          <div className="flex rounded-xl border border-gray-200 bg-gray-50 transition focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-100">
            <span className="flex items-center border-r border-gray-200 px-3 text-sm font-medium text-gray-500">
              +91
            </span>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="Enter your mobile number"
              maxLength={10}
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                setError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canSendOtp) handleSendOtp()
              }}
              className="flex-1 bg-transparent px-4 py-3 text-sm outline-none"
              autoFocus
            />
          </div>
        </div>
      ) : (
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">Email Address</label>
          <div className="flex rounded-xl border border-gray-200 bg-gray-50 transition focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-100">
            <span className="flex items-center border-r border-gray-200 px-3 text-gray-400">
              <Mail size={16} />
            </span>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canSendOtp) handleSendOtp()
              }}
              className="flex-1 bg-transparent px-4 py-3 text-sm outline-none"
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-sm text-red-500"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Send OTP */}
      <button
        onClick={handleSendOtp}
        disabled={!canSendOtp || loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 py-3.5 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
        {loading ? 'Sending...' : 'Send OTP'}
      </button>

      {/* Divider */}
      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-gray-400">Or continue with</span>
        </div>
      </div>

      {/* Switch method */}
      {method === 'phone' ? (
        <button
          onClick={switchToEmail}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <Mail size={16} /> Login with Email
        </button>
      ) : (
        <button
          onClick={switchToPhone}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <Phone size={16} /> Login with Phone
        </button>
      )}
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-lg font-bold text-gray-900">Enter OTP</h2>
        <p className="mt-1 text-sm text-gray-500">
          We sent a 6-digit code to{' '}
          <span className="font-semibold text-gray-700">
            {method === 'phone' ? `+91 ${maskPhone(phone)}` : maskEmail(email)}
          </span>
        </p>
      </div>

      {/* OTP Inputs */}
      <OtpInput value={otp} onChange={setOtp} onComplete={handleVerifyOtp} disabled={loading} />

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-center text-sm text-red-500"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 text-sm text-violet-600">
          <Loader2 size={16} className="animate-spin" />
          <span>Verifying...</span>
        </div>
      )}

      {/* Resend & Change */}
      <div className="flex items-center justify-between text-sm">
        <button onClick={goBackToStep1} className="font-medium text-gray-500 hover:text-gray-700">
          Change {method === 'phone' ? 'Number' : 'Email'}
        </button>
        <button
          onClick={handleResendOtp}
          disabled={resendCountdown > 0 || loading}
          className="font-medium text-violet-600 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
        >
          {resendCountdown > 0 ? `Resend OTP (${resendCountdown}s)` : 'Resend OTP'}
        </button>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-lg font-bold text-gray-900">Where should we send your report?</h2>
        <p className="mt-1 text-sm text-gray-500">
          We&apos;ll email your complete financial plan as a PDF
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-gray-700">Email Address</label>
        <div className="flex rounded-xl border border-gray-200 bg-gray-50 transition focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-100">
          <span className="flex items-center border-r border-gray-200 px-3 text-gray-400">
            <Mail size={16} />
          </span>
          <input
            type="email"
            placeholder="you@example.com"
            value={reportEmail}
            onChange={(e) => {
              setReportEmail(e.target.value)
              setError('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isValidEmail(reportEmail)) handleSaveEmail()
            }}
            className="flex-1 bg-transparent px-4 py-3 text-sm outline-none"
            autoFocus
          />
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-sm text-red-500"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <button
        onClick={handleSaveEmail}
        disabled={!isValidEmail(reportEmail) || loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 py-3.5 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
        {loading ? 'Saving...' : 'Send My Report'}
      </button>

      <div className="text-center">
        <button onClick={() => setStep(4)} className="text-sm font-medium text-gray-400 hover:text-gray-600">
          Skip for Now
        </button>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-5">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle size={20} className="text-emerald-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Almost Done!</h2>
        <p className="mt-1 text-sm text-gray-500">Confirm your name for the report</p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-gray-700">Full Name</label>
        <input
          type="text"
          placeholder="Enter your full name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError('')
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && name.trim()) handleFinish()
          }}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          autoFocus
        />
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-sm text-red-500"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <button
        onClick={handleFinish}
        disabled={!name.trim() || loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 py-3.5 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
        {loading ? 'Setting up...' : fromPlanner ? 'Generate My Plan' : 'Go to Dashboard'}
      </button>
    </div>
  )

  // ---------------------------------------------------------------------------
  // Page render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-gradient-to-br from-gray-50 via-violet-50/30 to-blue-50/30 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <motion.div
          variants={shakeVariants}
          animate={hasError ? 'shake' : 'idle'}
          className="rounded-2xl border border-gray-100 bg-white p-8 shadow-xl"
        >
          {/* Logo & branding */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600">
              <TrendingUp size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">Welcome to Trustner</h1>
            <p className="text-sm text-gray-500">
              {fromPlanner
                ? 'Verify your identity to generate your financial plan'
                : 'Login to manage your investments & insurance'}
            </p>
          </div>

          {/* Step indicator */}
          <div className="mb-6 flex items-center justify-center gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => {
              const stepNum = i + 1
              const isActive = stepNum === mappedStep
              const isCompleted = stepNum < mappedStep
              return (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'w-8 bg-gradient-to-r from-violet-600 to-blue-600'
                      : isCompleted
                        ? 'w-2 bg-violet-400'
                        : 'w-2 bg-gray-200'
                  }`}
                />
              )
            })}
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`step-${step}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep4()}
            </motion.div>
          </AnimatePresence>

          {/* KYC Notice */}
          <div className="mt-6 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
            <div className="flex items-start gap-2">
              <Shield size={14} className="mt-0.5 flex-shrink-0" />
              <p>{REGULATORY.KYC_NOTICE}</p>
            </div>
          </div>

          {/* Terms */}
          <p className="mt-6 text-center text-xs text-gray-400">
            By continuing, you agree to our{' '}
            <Link href="/terms" className="text-violet-600 hover:underline">
              Terms
            </Link>{' '}
            &amp;{' '}
            <Link href="/privacy-policy" className="text-violet-600 hover:underline">
              Privacy Policy
            </Link>
          </p>
        </motion.div>

        {/* Regulatory footer */}
        <p className="mt-4 text-center text-[11px] text-gray-400">
          {REGULATORY.AMFI_ARN} | {REGULATORY.MF_ENTITY}
        </p>
      </motion.div>
    </div>
  )
}
