'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { MONITORING_ENABLED } from '@/lib/features'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  exact?: boolean
}

const ALL_NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Inicio',
    exact: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    href: '/dashboard/locales',
    label: 'Locales',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l1.5-5h15L21 9" />
        <path d="M4 9v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9" />
        <path d="M9 21v-6h6v6" />
      </svg>
    ),
  },
  {
    href: '/dashboard/nuevo-local',
    label: 'Crear local',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
  },
  {
    href: '/dashboard/monitoreo',
    label: 'Monitoreo',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12h4l2 6 4-14 2 8h6" />
      </svg>
    ),
  },
]

const NAV_ITEMS: NavItem[] = ALL_NAV_ITEMS.filter(
  item => MONITORING_ENABLED || item.href !== '/dashboard/monitoreo',
)

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('watch_token')
    const role = localStorage.getItem('watch_role')
    if (!token || role !== 'ops_admin') {
      router.replace('/')
      return
    }
    setReady(true)
  }, [router])

  // Close mobile menu on navigation
  useEffect(() => { setMenuOpen(false) }, [pathname])

  function logout() {
    localStorage.removeItem('watch_token')
    localStorage.removeItem('watch_role')
    localStorage.removeItem('watch_name')
    router.replace('/')
  }

  if (!ready) return null

  const sidebarContent = (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', width: 213, alignItems: 'center', gap: 40, flexShrink: 0, alignSelf: 'stretch', flex: 1 }}>
        {/* Brand */}
        <div style={{ width: 193 }}>
          <div>
            <span style={{ fontFamily: 'var(--font-plus-jakarta-sans)', fontSize: '3.75rem', fontWeight: 800, lineHeight: '1.25rem', letterSpacing: '-0.15rem', color: '#000' }}>stri</span>
            <span style={{ fontFamily: 'var(--font-plus-jakarta-sans)', fontSize: '3.75rem', fontWeight: 800, lineHeight: '1.25rem', letterSpacing: '-0.15rem', color: '#5471FF' }}>x</span>
          </div>
          <div style={{ marginTop: 18, fontSize: 13, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9CA3AF' }}>Watch</div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-4 w-full">
          {NAV_ITEMS.map(item => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center transition-colors ${active ? 'bg-[#5471FF] rounded-xl' : 'hover:bg-[#F9FAFB] rounded-xl'}`}
                style={{ padding: '8px 16px', gap: 16, alignSelf: 'stretch', color: active ? '#fff' : '#676971', fontFamily: 'var(--font-plus-jakarta-sans)', fontSize: 16, fontWeight: active ? 600 : 400, lineHeight: '22px', letterSpacing: '0.1px' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', height: 34, opacity: active ? 1 : 0.3, color: active ? '#fff' : '#000' }}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-4 w-full">
        <button
          onClick={logout}
          className="flex items-center hover:bg-[#F9FAFB] transition-colors w-full text-left cursor-pointer rounded-xl"
          style={{ padding: '8px 16px', gap: 16, color: '#676971', fontFamily: 'var(--font-plus-jakarta-sans)', fontSize: 16, fontWeight: 400, lineHeight: '22px', letterSpacing: '0.1px' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', height: 34, opacity: 0.3, color: '#000' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </span>
          Salir
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen bg-[#EAECF0]">
      {/* ── Desktop sidebar (md+) ── */}
      <aside
        className="hidden md:flex shrink-0 bg-white flex-col h-full"
        style={{ width: 251, padding: '45px 19px 31px 19px', gap: 8, borderRadius: '0 24px 24px 0', borderRight: '1px solid #DCDEE4' }}
      >
        {sidebarContent}
      </aside>

      {/* ── Mobile overlay sidebar ── */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <aside
            className="relative z-50 bg-white flex flex-col h-full"
            style={{ width: 251, padding: '45px 19px 31px 19px', gap: 8, borderRadius: '0 24px 24px 0' }}
          >
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* ── Main ── */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Mobile top bar */}
        <header className="md:hidden relative flex items-center justify-center bg-white px-4 h-14 shrink-0 border-b border-[#DCDEE4]">
          <button
            onClick={() => setMenuOpen(true)}
            className="absolute left-4 p-2 rounded-lg hover:bg-[#F9FAFB] transition-colors"
            aria-label="Abrir menú"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span style={{ fontFamily: 'var(--font-plus-jakarta-sans)', fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.07rem', lineHeight: 1, color: '#000' }}>
            stri<span style={{ color: '#5471FF' }}>x</span>
          </span>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  )
}
