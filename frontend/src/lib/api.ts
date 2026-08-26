const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const REFRESH_TOKEN_KEY = 'oncoai_refresh_token'

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setStoredRefreshToken(token: string | null) {
  if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token)
  else localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken()
  if (!refreshToken) return null
  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  if (!res.ok) return null
  const data = await res.json()
  accessToken = data.access_token
  return accessToken
}

interface RequestOptions {
  method?: string
  body?: unknown
  form?: Record<string, string>
  auth?: boolean
}

async function request<T>(path: string, options: RequestOptions = {}, isRetry = false): Promise<T> {
  const { method = 'GET', body, form, auth = true } = options

  const headers: Record<string, string> = {}
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`

  let requestBody: BodyInit | undefined
  if (form) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
    requestBody = new URLSearchParams(form).toString()
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    requestBody = JSON.stringify(body)
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { method, headers, body: requestBody })

  if (res.status === 401 && auth && !isRetry) {
    const newToken = await refreshAccessToken()
    if (newToken) return request<T>(path, options, true)
  }

  if (!res.ok) {
    let detail = res.statusText
    try {
      const errBody = await res.json()
      detail = errBody.detail || detail
    } catch {
      // response wasn't JSON — keep statusText
    }
    throw new ApiError(res.status, detail)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  postForm: <T>(path: string, form: Record<string, string>) =>
    request<T>(path, { method: 'POST', form, auth: false }),
  postPublic: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body, auth: false }),
}
