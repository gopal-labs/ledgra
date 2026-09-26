import React, { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api'
import Button from '../components/Button'
import Input from '../components/Input'

const LedgraLogo = () => (
  <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
    <path d="M4 4h6v24H4V4zm8 0h16v6H12V4zm0 9h14v6H12v-6zm0 9h16v6H12v-6z" fill="white"/>
  </svg>
)

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
)

const EyeIcon = ({ open }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    {open ? (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </>
    ) : (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </>
    )}
  </svg>
)

// Steps: 'email' → 'otp' → 'reset'
const ForgotPasswordPage = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const otpRefs = useRef([])

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault()
    if (!email.trim()) { setError('Email is required'); return }
    setLoading(true); setError('')
    try {
      await authApi.forgotPassword({ email })
      setInfo('OTP sent! Check your email inbox.')
      setStep('otp')
    } catch {
      setError('Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify OTP
  const handleOTPChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
  }

  const handleOTPKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < 6) { setError('Please enter the full 6-digit OTP'); return }
    setLoading(true); setError('')
    try {
      await authApi.verifyOTP({ email, otp: code })
      setStep('reset')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP')
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Reset password
  const handleReset = async (e) => {
    e.preventDefault()
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true); setError('')
    try {
      await authApi.resetPassword({ email, password: newPassword })
      navigate('/login', { state: { message: 'Password reset successfully! Please sign in.' } })
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. Please start over.')
    } finally {
      setLoading(false)
    }
  }

  const STEP_TITLES = {
    email: { title: 'Forgot password?', subtitle: "Enter your email and we'll send you a reset OTP" },
    otp: { title: 'Check your email', subtitle: `Enter the 6-digit OTP sent to ${email}` },
    reset: { title: 'Set new password', subtitle: 'Create a strong new password for your account' },
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon"><LedgraLogo /></div>
          <span className="auth-logo-name">Ledgra</span>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {['email', 'otp', 'reset'].map((s, i) => (
            <div key={s} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: ['email', 'otp', 'reset'].indexOf(step) >= i
                ? 'var(--accent)' : 'var(--border-default)',
              transition: 'var(--transition)',
            }} />
          ))}
        </div>

        <h1 className="auth-title">{STEP_TITLES[step].title}</h1>
        <p className="auth-subtitle">{STEP_TITLES[step].subtitle}</p>

        {error && <div className="alert-error">{error}</div>}
        {info && !error && <div className="alert-success">{info}</div>}

        {/* Step 1: Email */}
        {step === 'email' && (
          <form onSubmit={handleSendOTP}>
            <Input
              label="Email Address"
              id="reset-email"
              name="email"
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              icon={<MailIcon />}
              autoFocus
            />
            <Button type="submit" variant="primary" fullWidth loading={loading} id="send-otp-btn">
              Send OTP
            </Button>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOTP}>
            <div style={{ marginBottom: 24 }}>
              <div className="form-label" style={{ textAlign: 'center', marginBottom: 12 }}>
                Enter OTP
              </div>
              <div className="otp-container">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    className="otp-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOTPChange(i, e.target.value)}
                    onKeyDown={(e) => handleOTPKeyDown(i, e)}
                    id={`otp-${i}`}
                    autoFocus={i === 0}
                  />
                ))}
              </div>
            </div>
            <Button type="submit" variant="primary" fullWidth loading={loading} id="verify-otp-btn">
              Verify OTP
            </Button>
            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <button
                type="button"
                onClick={() => { setStep('email'); setOtp(['', '', '', '', '', '']); setError('') }}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}
              >
                ← Resend OTP
              </button>
            </div>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 'reset' && (
          <form onSubmit={handleReset}>
            <Input
              label="New Password"
              id="new-password"
              name="newPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min 8 characters"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setError('') }}
              icon={<LockIcon />}
              rightElement={
                <span onClick={() => setShowPassword((v) => !v)}>
                  <EyeIcon open={showPassword} />
                </span>
              }
              autoFocus
            />
            <Button type="submit" variant="primary" fullWidth loading={loading} id="reset-password-btn">
              Reset Password
            </Button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
          <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
