import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { BrandMark } from '@/components/ui/BrandMark'
import { NotificationBell } from '@/components/ui/NotificationBell'
import { GlobalSearch } from '@/components/ui/GlobalSearch'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/patients', label: 'Patients' },
  { to: '/tumor-board', label: 'Tumor Board' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/reports', label: 'Reports' },
  { to: '/analytics', label: 'Analytics' },
]

export function AuthedNav() {
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <nav className="nav no-print">
      <div className="nav-inner">
        <NavLink to="/dashboard" className="logo">
          <BrandMark />
          OncoAI<span className="dot">.</span>
        </NavLink>
        <ul className="nav-links" style={open ? { display: 'flex' } : undefined}>
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => setOpen(false)}>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="nav-actions">
          <GlobalSearch />
          <NotificationBell />
          <a
            href="#"
            className="login-link"
            onClick={(e) => {
              e.preventDefault()
              logout()
            }}
          >
            Log out
          </a>
        </div>
        <button className="nav-toggle" aria-label="Toggle menu" onClick={() => setOpen((v) => !v)}>
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  )
}
