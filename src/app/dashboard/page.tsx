'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ops, type Summary, type Business, type MonitoringSummary } from '@/lib/ops'
import { PageHeader, Section, Metric, StatusBadge, Button, Toast } from '@/components/ui'
import { MONITORING_ENABLED } from '@/lib/features'

export default function InicioPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [monitoring, setMonitoring] = useState<MonitoringSummary[]>([])
  const [error, setError] = useState('')
  const [name, setName] = useState('')

  useEffect(() => {
    setName(localStorage.getItem('watch_name') || 'Ops')
    Promise.all([
      ops.summary(),
      ops.businesses(),
      MONITORING_ENABLED ? ops.monitoringSummary() : Promise.resolve([] as MonitoringSummary[]),
    ])
      .then(([s, b, m]) => { setSummary(s); setBusinesses(b); setMonitoring(m) })
      .catch(err => setError(err instanceof Error ? err.message : 'Error cargando panel'))
  }, [])

  const recent = businesses.slice(0, 5)

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <PageHeader title={`Hola, ${name}`} subtitle="Resumen general de la operación de strix." />
      <Toast message={error} tone="error" />

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Metric label="Locales" value={summary?.businesses ?? '—'} />
        <Metric label="Activos" value={summary?.active_businesses ?? '—'} />
        <Metric label="Admins" value={summary?.admins ?? '—'} />
        <Metric label="Membresías" value={summary?.memberships ?? '—'} />
        <Metric label="Alertas" value={summary?.alerts ?? '—'} />
        <Metric label="Apps" value={summary?.monitored_apps ?? '—'} />
      </div>

      <div className={MONITORING_ENABLED ? 'grid lg:grid-cols-2 gap-6' : 'grid gap-6'}>
        <Section
          title="Locales recientes"
          action={<Link href="/dashboard/locales"><Button variant="ghost">Ver todos</Button></Link>}
        >
          {recent.length === 0 ? (
            <p className="text-sm text-[#6B7280]">Todavía no hay locales. <Link href="/dashboard/nuevo-local" className="text-[#5471FF] underline">Crear el primero</Link>.</p>
          ) : (
            <div className="flex flex-col divide-y divide-[#F3F4F6]">
              {recent.map(b => (
                <Link key={b.id} href={`/dashboard/locales/${b.id}`} className="flex items-center justify-between gap-4 py-3 hover:opacity-70 transition">
                  <div>
                    <div className="font-medium">{b.name}</div>
                    <div className="text-sm text-[#6B7280]">{b.owner.name} · {b.owner.email}</div>
                  </div>
                  <StatusBadge status={b.status} />
                </Link>
              ))}
            </div>
          )}
        </Section>

        {MONITORING_ENABLED && (
          <Section
            title="Estado de apps"
            action={<Link href="/dashboard/monitoreo"><Button variant="ghost">Monitoreo</Button></Link>}
          >
            {monitoring.length === 0 ? (
              <p className="text-sm text-[#6B7280]">Sin datos de monitoreo aún.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {monitoring.map(m => (
                  <div key={m.app_id} className="flex items-center justify-between gap-4 rounded-2xl border border-[#E5E7EB] px-4 py-3">
                    <div>
                      <div className="font-medium">{m.name}</div>
                      <div className="text-sm text-[#6B7280]">{m.base_url}</div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-semibold">{m.uptime_percent != null ? `${m.uptime_percent}%` : 'sin datos'}</div>
                      <div className="text-[#6B7280]">p95 {m.percentiles.p95 ?? '—'} ms</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}
      </div>
    </div>
  )
}
