import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/lib/api'

const QUICK_LOGINS = [
  { email: 'coordinator@oncoai.demo', role: 'Tumor Board Coordinator' },
  { email: 'oncologist@oncoai.demo', role: 'Oncologist' },
  { email: 'surgeon@oncoai.demo', role: 'Surgeon' },
  { email: 'radiologist@oncoai.demo', role: 'Radiologist' },
  { email: 'pathologist@oncoai.demo', role: 'Pathologist' },
  { email: 'admin@oncoai.demo', role: 'Administrator' },
]
const DEMO_PASSWORD = 'Demo1234!'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to sign in.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <div className="auth-panel-inner">
          <div className="auth-icon-badge">
            <svg className="icon" width={30} height={30} viewBox="0 0 24 24">
              <path d="M4 12h4l2 7 4-14 2 7h4" />
            </svg>
          </div>
          <h1>OncoAI</h1>
          <p className="desc">
            AI-powered clinical decision support for East African oncology teams. Built on
            Saratani AI's mission for tumor board workflows, treatment recommendations, and
            predictive analytics across Tanzania.
          </p>

          <div className="auth-stats">
            <div className="auth-stat-box">
              <div className="num">12,000+</div>
              <div className="label">Cases Analyzed</div>
            </div>
            <div className="auth-stat-box">
              <div className="num">98.7%</div>
              <div className="label">Guideline Concordance</div>
            </div>
          </div>

          <div className="auth-compliance">
            <span>✓ WHO Compliant</span>
            <span>✓ TMDA Approved</span>
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-inner">
          <h2>Welcome back</h2>
          <p className="sub">Sign in to access the clinical dashboard</p>

          {error && <div className="form-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="toggle-visibility"
                  aria-label="Show password"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  👁
                </button>
              </div>
            </div>
            <div className="form-row">
              <label>
                <input type="checkbox" /> Remember me
              </label>
              <a href="#">Forgot password?</a>
            </div>
            <button type="submit" className="btn btn-dark btn-block" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          <div className="demo-login-label">Quick demo login</div>
          <div className="role-grid">
            {QUICK_LOGINS.map((account) => (
              <button
                key={account.email}
                type="button"
                className="role-card clinician"
                onClick={() => {
                  setEmail(account.email)
                  setPassword(DEMO_PASSWORD)
                }}
              >
                <strong>{account.role}</strong>
                <span>{account.email}</span>
              </button>
            ))}
          </div>

          <div className="auth-toggle">
            New to OncoAI? <Link to="/register">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
