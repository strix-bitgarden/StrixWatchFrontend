'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { API_BASE_URL } from '@/lib/config'

export default function LoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/auth/staff-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || `Error ${res.status}`)
      if (data.role !== 'ops_admin') throw new Error('Este panel requiere un usuario ops_admin')
      localStorage.setItem('watch_token', data.access_token)
      localStorage.setItem('watch_role', data.role)
      localStorage.setItem('watch_name', data.name)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-6 bg-[#EAECF0]">
      <form onSubmit={handleLogin} className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-[#E5E7EB] p-8 flex flex-col gap-5">
        <div className="text-center">
          <div className="text-5xl font-extrabold tracking-tight">stri<span className="text-[#5471FF]">x</span></div>
          <h1 className="mt-4 text-2xl font-bold">Watch</h1>
          <p className="text-sm text-[#6B7280] mt-2">Panel de monitoreo, locales, admins y membresías.</p>
        </div>
        <label className="flex flex-col gap-2 text-sm">
          Usuario o email
          <input className="h-11 rounded-xl border border-[#D1D5DB] px-3" value={identifier} onChange={e => setIdentifier(e.target.value)} required autoComplete="username" autoFocus />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          Contraseña
          <input type="password" className="h-11 rounded-xl border border-[#D1D5DB] px-3" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button disabled={loading} className="h-11 rounded-xl bg-[#5471FF] text-white font-semibold disabled:opacity-50">
          {loading ? 'Ingresando...' : 'Ingresar a Watch'}
        </button>
      </form>
    </div>
  )
}
