'use client'

import { useState, useRef, useEffect, useCallback, type KeyboardEvent, type ChangeEvent } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Mail, Shield, ArrowRight, X, CheckCircle, Loader2 } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthGateProps {
  onSuccess: () => void
  onClose: () => void
  prefillName?: string
  prefillCity?: string
}

type AuthMethod = 'phone' | 'email'
type Step = 1 | 2 | 3 | 4

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 25, stiffness: 300 } },
  exit: { opacity: 0, y: 40, scale: 0.97, transition: { duration: 0.2 } },
}

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

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return email
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
// Main AuthGate component
// ---------------------------------------------------------------------------

export default function AuthGate({ onSuccess, onClose, prefillName, prefillCity }: AuthGateProps) {
  const auth = useAuth()

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
  const [name, setName] = useState(prefillName ?? '')

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasError, setHasError] = useState(false) // triggers shake
  const [resendCountdown, setResendCountdown] = useState(0)

  // ---- Resend countdown ----
  useEffect(() => {
    if (resendCountdown <= 0) return
    const timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCountdown])

  // ---- Handlers ----

  const triggerError = useCallback((msg: string) => {
    setError(msg)
    setHasError(true)
    setTimeout(() => setHasError(false), 600)
  }, [])

  // Step 1 - Send OTP
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

  // Step 2 - Verify OTP
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
        // If email method, skip step 3 (already have email). Go to step 4.
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

  // Step 2 - Resend OTP
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

  // Step 3 - Save email
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

  // Step 4 - Confirm name & finish
  const handleFinish = useCallback(async () => {
    setError('')
    if (!name.trim()) {
      triggerError('Please enter your name.')
      return
    }
    setLoading(true)
    try {
      await auth.updateProfile({ name: name.trim(), city: prefillCity })
      onSuccess()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong.'
      triggerError(message)
    } finally {
      setLoading(false)
    }
  }, [name, prefillCity, auth, onSuccess, triggerError])

  // ---- Switch auth method ----
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

  // ---- Go back from OTP ----
  const goBackToStep1 = useCallback(() => {
    setStep(1)
    setOtp(Array(6).fill(''))
    setError('')
    setResendCountdown(0)
  }, [])

  // ---- Computed ----
  const canSendOtp = method === 'phone' ? isValidPhone(phone) : isValidEmail(email)

  // ---- Render steps ----

  const renderStep1 = () => (
    <div className="space-y-5">
      {/* Heading */}
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600">
          {method === 'phone' ? (
            <Phone size={22} className="text-white" />
          ) : (
            <Mail size={22} className="text-white" />
          )}
        </div>
        <h2 className="text-xl font-extrabold text-gray-900">Verify Your Identity</h2>
        <p className="mt-1 text-sm text-gray-500">
          We need to verify your {method === 'phone' ? 'phone number' : 'email'} to generate your personalized
          financial plan.
        </p>
      </div>

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

      {/* Send OTP Button */}
      <button
        onClick={handleSendOtp}
        disabled={!canSendOtp || loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 py-3.5 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
        {loading ? 'Sending...' : 'Send OTP'}
      </button>

      {/* Switch method */}
      <div className="text-center">
        {method === 'phone' ? (
          <button onClick={switchToEmail} className="text-sm font-medium text-violet-600 hover:underline">
            Use Email Instead
          </button>
        ) : (
          <button onClick={switchToPhone} className="text-sm font-medium text-violet-600 hover:underline">
            Use Phone Instead
          </button>
        )}
      </div>

      {/* Trust badge */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <Shield size={12} />
        <span>Your data is encrypted &amp; stored securely</span>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-5">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600">
          <Shield size={22} className="text-white" />
        </div>
        <h2 className="text-xl font-extrabold text-gray-900">Enter OTP</h2>
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

      {/* Loading indicator */}
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
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600">
          <Mail size={22} className="text-white" />
        </div>
        <h2 className="text-xl font-extrabold text-gray-900">Where should we send your report?</h2>
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
        <button
          onClick={() => setStep(4)}
          className="text-sm font-medium text-gray-400 hover:text-gray-600"
        >
          Skip for Now
        </button>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-5">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
          <CheckCircle size={22} className="text-white" />
        </div>
        <h2 className="text-xl font-extrabold text-gray-900">Almost Done!</h2>
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
        {loading ? 'Setting up...' : 'Generate My Plan'}
      </button>
    </div>
  )

  // ---- Step progress dots ----
  const renderStepIndicator = () => {
    const totalSteps = method === 'email' ? 3 : 4
    const mappedStep = method === 'email' && step === 4 ? 3 : step

    return (
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
    )
  }

  // ---- Main render ----
  return (
    <AnimatePresence>
      <motion.div
        key="auth-gate-overlay"
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <motion.div
          key="auth-gate-card"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative w-full max-w-md"
        >
          <motion.div
            variants={shakeVariants}
            animate={hasError ? 'shake' : 'idle'}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl sm:p-8"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            {/* Step indicator */}
            {renderStepIndicator()}

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
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
