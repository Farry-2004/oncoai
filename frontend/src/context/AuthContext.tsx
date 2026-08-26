import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, setAccessToken, setStoredRefreshToken, getStoredRefreshToken } from '@/lib/api'
import type { TokenPair, User } from '@/types/api'

type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

interface AuthContextValue {
  user: User | null
  status: AuthStatus
  login: (email: string, password: string) => Promise<void>
  register: (input: {
    email: string
    password: string
    full_name: string
    role: string
  }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function applyTokenPair(pair: TokenPair) {
  setAccessToken(pair.access_token)
  setStoredRefreshToken(pair.refresh_token)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  useEffect(() => {
    async function bootstrap() {
      const refreshToken = getStoredRefreshToken()
      if (!refreshToken) {
        setStatus('anonymous')
        return
      }
      try {
        const res = await api.postPublic<{ access_token: string }>('/auth/refresh', {
          refresh_token: refreshToken,
        })
        setAccessToken(res.access_token)
        const me = await api.get<User>('/auth/me')
        setUser(me)
        setStatus('authenticated')
      } catch {
        setStoredRefreshToken(null)
        setStatus('anonymous')
      }
    }
    bootstrap()
  }, [])

  async function login(email: string, password: string) {
    const pair = await api.postForm<TokenPair>('/auth/login', { username: email, password })
    applyTokenPair(pair)
    setUser(pair.user)
    setStatus('authenticated')
  }

  async function register(input: {
    email: string
    password: string
    full_name: string
    role: string
  }) {
    const pair = await api.postPublic<TokenPair>('/auth/register', input)
    applyTokenPair(pair)
    setUser(pair.user)
    setStatus('authenticated')
  }

  function logout() {
    setAccessToken(null)
    setStoredRefreshToken(null)
    setUser(null)
    setStatus('anonymous')
  }

  return (
    <AuthContext.Provider value={{ user, status, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
