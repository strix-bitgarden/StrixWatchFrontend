export function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('watch_token')
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const headers = new Headers(init?.headers || {})
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) throw new Error(data?.detail || `Error ${res.status}`)
  return data as T
}
