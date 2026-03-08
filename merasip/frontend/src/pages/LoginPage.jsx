import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ComplianceFooter from '../components/ComplianceFooter'

const C = { navy: '#1B3A6B', muted: '#6B7280', border: '#D1D5DB', red: '#B91C1C' }

export default function LoginPage() {
  const [step, setStep] = useState('email') // email | otp
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, verifyOTP } = useAuth()
  const navigate = useNavigate()

  const handleSendOTP = async () => {
    if (!email) return
    setLoading(true)
    setError('')
    try {
      await login(email)
      setStep('otp')
    } catch (err) {
      setError(err.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!otp) return
    setLoading(true)
    setError('')
    try {
      await verifyOTP(email, otp)
      navigate('/advisor')
    } catch (err) {
      setError(err.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAFBFC', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: C.navy, padding: '16px 24px' }}>
        <a href="/review" style={{ color: '#fff', fontWeight: 800, fontSize: 20, fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
          MeraSIP
        </a>
      </header>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{
          background: '#fff', borderRadius: 12, padding: 32,
          border: `1px solid ${C.border}`, width: '100%', maxWidth: 400,
        }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.navy, fontFamily: 'Georgia, serif' }}>
              Advisor Login
            </div>
            <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>
              MeraSIP S.M.A.R.T Platform | ARN-286886
            </div>
          </div>

          {step === 'email' && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 6 }}>
                Advisor Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
                placeholder="advisor@trustner.in"
                style={{
                  width: '100%', padding: '12px 14px', border: `1px solid ${C.border}`,
                  borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box',
                }}
              />
              <button
                onClick={handleSendOTP}
                disabled={!email || loading}
                style={{
                  width: '100%', marginTop: 16, padding: '12px',
                  background: email ? C.navy : '#D1D5DB', color: '#fff',
                  border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700,
                  cursor: email && !loading ? 'pointer' : 'not-allowed',
                }}
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </div>
          )}

          {step === 'otp' && (
            <div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 16, textAlign: 'center' }}>
                OTP sent to <strong>{email}</strong>
              </div>
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleVerify()}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                style={{
                  width: '100%', padding: '12px 14px', border: `1px solid ${C.border}`,
                  borderRadius: 8, fontSize: 20, textAlign: 'center', letterSpacing: 8,
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
              <button
                onClick={handleVerify}
                disabled={!otp || loading}
                style={{
                  width: '100%', marginTop: 16, padding: '12px',
                  background: otp ? C.navy : '#D1D5DB', color: '#fff',
                  border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700,
                  cursor: otp && !loading ? 'pointer' : 'not-allowed',
                }}
              >
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>
              <button
                onClick={() => { setStep('email'); setOtp('') }}
                style={{
                  width: '100%', marginTop: 8, padding: 8,
                  background: 'transparent', border: 'none', color: C.muted,
                  fontSize: 12, cursor: 'pointer',
                }}
              >
                Change email
              </button>
            </div>
          )}

          {error && (
            <div style={{
              marginTop: 12, padding: '10px 14px', background: '#FEF2F2',
              border: '1px solid #FECACA', borderRadius: 6, color: C.red, fontSize: 12,
            }}>
              {error}
            </div>
          )}
        </div>
      </div>

      <ComplianceFooter />
    </div>
  )
}
