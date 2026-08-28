import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Alert } from '@/components/ui/Alert'
import { ApiError } from '@/lib/api'
import type { Role } from '@/types/api'

const FEATURED_ROLES: { value: Role; label: string; className: string; description: string; icon: ReactNode }[] = [
  {
    value: 'oncologist',
    label: 'Oncologist',
    className: 'oncologist',
    description: 'Full access to cases, predictions, and tumor boards',
    icon: (
      <svg className="icon" width={16} height={16} viewBox="0 0 24 24">
        <path d="M4 12h4l2 7 4-14 2 7h4" />
      </svg>
    ),
  },
  {
    value: 'medical_officer',
    label: 'Medical Officer',
    className: 'clinician',
    description: 'Patient management, case creation, AI predictions',
    icon: (
      <svg className="icon" width={16} height={16} viewBox="0 0 24 24">
        <path d="M9.5 2a4.5 4.5 0 0 0-4.4 5.5A4 4 0 0 0 4 15a4 4 0 0 0 3 6.9M14.5 2a4.5 4.5 0 0 1 4.4 5.5A4 4 0 0 1 20 15a4 4 0 0 1-3 6.9" />
      </svg>
    ),
  },
  {
    value: 'radiologist',
    label: 'Radiologist',
    className: 'radiologist',
    description: 'Imaging review, AI annotation, diagnostic reports',
    icon: (
      <svg className="icon" width={16} height={16} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    value: 'administrator',
    label: 'Administrator',
    className: 'administrator',
    description: 'User management, system settings, audit logs',
    icon: (
      <svg className="icon" width={16} height={16} viewBox="0 0 24 24">
        <path d="M12 2 4 6v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V6z" />
      </svg>
    ),
  },
]

const OTHER_ROLES: { value: Role; label: string }[] = [
  { value: 'tumor_board_coordinator', label: 'Tumor Board Coordinator' },
  { value: 'surgeon', label: 'Surgeon' },
  { value: 'pathologist', label: 'Pathologist' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'nutritionist', label: 'Nutritionist' },
  { value: 'social_worker', label: 'Social Worker' },
  { value: 'dentist', label: 'Dentist' },
  { value: 'pharmacist', label: 'Pharmacist' },
]

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('oncologist')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await register({ email, password, full_name: fullName, role })
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to create account.')
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
          <h2>Create your account</h2>
          <p className="sub">Choose your role, then set up sign-in</p>

          <div className="demo-login-label">I am a…</div>
          <div className="role-grid">
            {FEATURED_ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                className={`role-card ${r.className} ${role === r.value ? 'selected' : ''}`}
                onClick={() => setRole(r.value)}
              >
                <div className="role-icon">{r.icon}</div>
                <strong>{r.label}</strong>
                <span>{r.description}</span>
              </button>
            ))}
          </div>

          <div className="field" style={{ marginTop: 14 }}>
            <label htmlFor="other-role">Other clinical roles</label>
            <select
              id="other-role"
              value={OTHER_ROLES.some((r) => r.value === role) ? role : ''}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              <option value="" disabled>
                Select a role…
              </option>
              {OTHER_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="divider">your details</div>

          {error && <Alert type="error">{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="signup-name">Full name</label>
              <input
                type="text"
                id="signup-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Jane Doe"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="signup-email">Email address</label>
              <input
                type="email"
                id="signup-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="signup-password">Password</label>
              <input
                type="password"
                id="signup-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                minLength={8}
                required
              />
            </div>
            <button type="submit" className="btn btn-dark btn-block" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>

          <div className="auth-toggle">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
