'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ops, type Business } from '@/lib/ops'
import { PageHeader, Section, StatusBadge, Input, Button, Toast } from '@/components/ui'

type Filter = 'all' | 'active' | 'paused' | 'deleted'

export default function LocalesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    ops.businesses()
      .then(setBusinesses)
      .catch(err => setError(err instanceof Error ? err.message : 'Error cargando locales'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return businesses.filter(b => {
      if (filter !== 'all' && b.status !== filter) return false
      if (!q) return true
      return b.name.toLowerCase().includes(q) || b.owner.email.toLowerCase().includes(q) || b.owner.name.toLowerCase().includes(q)
    })
  }, [businesses, query, filter])

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'active', label: 'Activos' },
    { id: 'paused', label: 'Pausados' },
    { id: 'deleted', label: 'Eliminados' },
  ]

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <PageHeader
        title="Locales"
        subtitle="Gestioná cada comercio individualmente."
        action={<Link href="/dashboard/nuevo-local"><Button>+ Crear local</Button></Link>}
      />
      <Toast message={error} tone="error" />

      <Section>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Buscar por nombre u owner…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 min-w-[220px]"
          />
          <div className="flex gap-2">
            {filters.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`h-9 rounded-full px-4 text-sm font-medium transition ${filter === f.id ? 'bg-[#5471FF] text-white' : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-[#6B7280] py-6 text-center">Cargando…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-[#6B7280] py-6 text-center">No hay locales que coincidan.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[#6B7280] border-b border-[#E5E7EB]">
                  <th className="pb-2 font-medium">Local</th>
                  <th className="pb-2 font-medium">Owner</th>
                  <th className="pb-2 font-medium">Estado</th>
                  <th className="pb-2 font-medium text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id} className="border-b border-[#F3F4F6] hover:bg-[#FAFAFB]">
                    <td className="py-3">
                      <div className="font-medium">{b.name}</div>
                      <div className="text-[#6B7280]">{b.address || 'Sin dirección'}</div>
                    </td>
                    <td>
                      <div>{b.owner.name}</div>
                      <div className="text-[#6B7280]">{b.owner.email}</div>
                    </td>
                    <td><StatusBadge status={b.status} /></td>
                    <td className="text-right">
                      <Link href={`/dashboard/locales/${b.id}`} className="text-[#5471FF] font-medium hover:underline">Gestionar →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  )
}
