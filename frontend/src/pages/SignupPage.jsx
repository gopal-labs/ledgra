import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api'
import Button from '../components/Button'
import Input from '../components/Input'

const LedgraLogo = () => (
  <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
    <path d="M4 4h6v24H4V4zm8 0h16v6H12V4zm0 9h14v6H12v-6zm0 9h16v6H12v-6z" fill="white"/>
  </svg>
)

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
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

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /\d/.test(p) },
  { label: 'One special character (!@#$...)', test: (p) => /[^A-Za-z0-9]/.test(p) },
]

const SignupPage = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ loginId: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState({})
  const [globalError, setGlobalError] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.loginId) {
      e.loginId = 'Login ID is required'
    } else if (!/^[a-zA-Z0-9]+$/.test(form.loginId)) {
      e.loginId = 'Login ID must be alphanumeric only'
    } else if (form.loginId.length < 6 || form.loginId.length > 12) {
      e.loginId = 'Login ID must be 6-12 characters'
    }

    if (!form.email) {
      e.email = 'Email is required'
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      e.email = 'Please enter a valid email'
    }

    const failedRules = PASSWORD_RULES.filter((r) => !r.test(form.password))
    if (failedRules.length > 0) {
      e.password = failedRules[0].label
    }

    if (form.password !== form.confirmPassword) {
      e.confirmPassword = 'Passwords do not match'
    }

    return e
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' })
    if (globalError) setGlobalError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length > 0) { setErrors(e2); return }

    setLoading(true)
    try {
      await authApi.signup({ loginId: form.loginId, email: form.email, password: form.password })
      navigate('/login', { state: { message: 'Account created! Please sign in.' } })
    } catch (err) {
      const msg = err.response?.data?.message || 'Signup failed. Please try again.'
      if (msg.toLowerCase().includes('login id')) setErrors({ loginId: msg })
      else if (msg.toLowerCase().includes('email')) setErrors({ email: msg })
      else setGlobalError(msg)
    } finally {
      setLoading(false)
    }
  }

  const passwordStrength = PASSWORD_RULES.filter((r) => r.test(form.password)).length

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <LedgraLogo />
          </div>
          <span className="auth-logo-name">Ledgra</span>
        </div>

        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Join your team's inventory workspace</p>

        {globalError && (
          <div className="alert-error">{globalError}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Input
            label="Login ID"
            id="loginId"
            name="loginId"
            type="text"
            placeholder="6-12 alphanumeric characters"
            value={form.loginId}
            onChange={handleChange}
            error={errors.loginId}
            icon={<UserIcon />}
            autoFocus
          />

          <Input
            label="Email Address"
            id="email"
            name="email"
            type="email"
            placeholder="you@company.com"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            icon={<MailIcon />}
          />

          <Input
            label="Password"
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a strong password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            icon={<LockIcon />}
            rightElement={
              <span onClick={() => setShowPassword((v) => !v)}>
                <EyeIcon open={showPassword} />
              </span>
            }
          />

          {/* Password strength indicator */}
          {form.password && (
            <div style={{ marginTop: -8, marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} style={{
                    flex: 1, height: 3, borderRadius: 2,
                    background: i <= passwordStrength
                      ? passwordStrength <= 2 ? 'var(--danger)'
                        : passwordStrength <= 3 ? 'var(--warning)'
                        : 'var(--success)'
                      : 'var(--border-default)',
                    transition: 'var(--transition)',
                  }} />
                ))}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
                {PASSWORD_RULES.map((rule) => {
                  const ok = rule.test(form.password)
                  return (
                    <span key={rule.label} style={{
                      fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 4,
                      color: ok ? 'var(--success)' : 'var(--text-muted)',
                    }}>
                      {ok ? <CheckIcon /> : <XIcon />} {rule.label}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          <Input
            label="Re-enter Password"
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            placeholder="Confirm your password"
            value={form.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            icon={<LockIcon />}
            rightElement={
              <span onClick={() => setShowConfirm((v) => !v)}>
                <EyeIcon open={showConfirm} />
              </span>
            }
          />

          <Button type="submit" variant="primary" fullWidth loading={loading} style={{ marginTop: 4 }} id="signup-btn">
            Create Account
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SignupPage
