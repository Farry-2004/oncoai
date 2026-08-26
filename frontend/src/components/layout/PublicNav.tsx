import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BrandMark } from '@/components/ui/BrandMark'

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#solutions', label: 'Solutions' },
  { href: '#research', label: 'Research' },
  { href: '#about', label: 'About' },
]

export function PublicNav() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link to="/" className="logo">
          <BrandMark />
          OncoAI<span className="dot">.</span>
        </Link>
        <ul className="nav-links" style={open ? { display: 'flex' } : undefined}>
          {LINKS.map((link, i) => (
            <li key={link.href}>
              <a href={link.href} className={i === 0 ? 'active' : undefined} onClick={() => setOpen(false)}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="nav-actions">
          <Link to="/login" className="login-link">
            Log in
          </Link>
          <Link to="/login" className="btn btn-dark">
            Get Started
          </Link>
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
