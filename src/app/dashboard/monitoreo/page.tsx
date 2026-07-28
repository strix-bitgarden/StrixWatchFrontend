'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ops,
  type AlertRule,
  type MonitoredApp,
  type MonitoringSummary,
  type ObservabilityEvent,
  type ObservabilitySummary,
} from '@/lib/ops'
import { PageHeader, Section, Metric, Field, Input, Select, Button, Toast } from '@/components/ui'
import { MONITORING_ENABLED } from '@/lib/features'

const emptyAlert = { name: '', app_id: '', channel: 'ui', max_latency_ms: 1500, min_uptime_percent: 95, min_rps: 0 }

function whenLabel(iso?: string | null): string {
  if (!iso) return 'nunca'
  return new Date(iso).toLocaleString()
}

const KIND_STYLE: Record<string, string> = {
  deploy: 'bg-[#DBEAFE] text-[#1E40AF]',
  crash: 'bg-[#FEE2E2] text-[#991B1B]',
  log: 'bg-[#F3F4F6] text-[#6B7280]',
}

export default function MonitoreoPage() {
  const router = useRouter()
  const [apps, setApps] = useState<MonitoredApp[]>([])
  const [summary, setSummary] = useState<MonitoringSummary[]>([])
  const [alerts, setAlerts] = useState<AlertRule[]>([])
  const [events, setEvents] = useState<ObservabilityEvent[]>([])
  const [activity, setActivity] = useState<ObservabilitySummary[]>([])
  const [alertForm, setAlertForm] = useState(emptyAlert)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [running, setRunning] = useState(false)

  const load = useCallback(async () => {
    const [appsData, summaryData, alertsData, eventsData, activityData] = await Promise.all([
      ops.monitoredApps(),
      ops.monitoringSummary(),
      ops.alerts(),
      ops.observabilityEvents({ limit: 30 }),
      ops.observabilitySummary(),
    ])
    setApps(appsData)
    setSummary(summaryData)
    setAlerts(alertsData)
    setEvents(eventsData)
    setActivity(activityData)
  }, [])

  useEffect(() => {
    if (!MONITORING_ENABLED) {
      router.replace('/dashboard')
      return
    }
    load().catch(err => setError(err instanceof Error ? err.message : 'Error cargando monitoreo'))
  }, [load, router])

  if (!MONITORING_ENABLED) return null

  async function run(action: () => Promise<unknown>, okMessage: string) {
    setError('')
    setMessage('')
    try {
      await action()
      setMessage(okMessage)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error')
    }
  }

  async function runChecks() {
    setRunning(true)
    await run(() => ops.runChecks('watch.monitoreo'), 'Chequeos ejecutados')
    setRunning(false)
  }

  async function submitAlert(e: FormEvent) {
    e.preventDefault()
    await run(() => ops.createAlert({ ...alertForm, app_id: alertForm.app_id || null }), 'Alerta creada')
    setAlertForm(emptyAlert)
  }

  const okApps = summary.filter(s => (s.uptime_percent ?? 0) >= 99).length
  const errors24h = activity.reduce((n, a) => n + a.errors_24h, 0)

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <PageHeader
        title="Monitoreo"
        subtitle="Estado y latencia de las apps de strix."
        action={<Button variant="dark" onClick={runChecks} disabled={running}>{running ? 'Ejecutando…' : 'Ejecutar chequeos'}</Button>}
      />
      <Toast message={message} />
      <Toast message={error} tone="error" />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Metric label="Apps monitoreadas" value={apps.length} />
        <Metric label="Apps saludables" value={`${okApps}/${summary.length}`} hint="uptime ≥ 99%" />
        <Metric label="Errores (24h)" value={errors24h} hint="desde providers" />
        <Metric label="Apps habilitadas" value={apps.filter(a => a.enabled).length} />
        <Metric label="Alertas activas" value={alerts.filter(a => a.enabled).length} />
      </div>

      <Section title="Estado de las apps">
        {summary.length === 0 ? (
          <p className="text-sm text-[#6B7280]">Sin datos. Ejecutá los chequeos para poblar métricas.</p>
        ) : (
          <div className="grid gap-3">
            {summary.map(item => {
              const healthy = (item.uptime_percent ?? 0) >= 99
              return (
                <div key={item.app_id} className="rounded-2xl border border-[#E5E7EB] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`h-2.5 w-2.5 rounded-full ${item.uptime_percent == null ? 'bg-[#D1D5DB]' : healthy ? 'bg-[#22C55E]' : 'bg-[#EF4444]'}`} />
                      <div>
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-sm text-[#6B7280]">{item.base_url}</div>
                      </div>
                    </div>
                    <div className="text-sm text-right">
                      <div className="font-semibold">Uptime {item.uptime_percent != null ? `${item.uptime_percent}%` : '—'} · RPS {item.rps}</div>
                      <div className="text-[#6B7280]">p50 {item.percentiles.p50 ?? '—'} · p95 {item.percentiles.p95 ?? '—'} · p99 {item.percentiles.p99 ?? '—'} ms</div>
                    </div>
                  </div>
                  {item.latest_error ? <div className="mt-2 text-sm text-[#DC2626]">Último error: {item.latest_error}</div> : null}
                </div>
              )
            })}
          </div>
        )}
      </Section>

      <Section title="Actividad (deploys, crashes y errores)">
        <div className="grid sm:grid-cols-3 gap-3">
          {activity.map(a => (
            <div key={a.app} className="rounded-2xl border border-[#E5E7EB] p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold uppercase text-sm tracking-wide">{a.app}</span>
                <span className={`text-xs font-semibold ${a.errors_24h > 0 ? 'text-[#DC2626]' : 'text-[#166534]'}`}>{a.errors_24h} err/24h</span>
              </div>
              <div className="text-xs text-[#6B7280] mt-2">Último deploy: {whenLabel(a.last_deploy)}</div>
              <div className="text-xs text-[#6B7280]">Último crash: {a.last_crash ? whenLabel(a.last_crash) : 'nunca'}</div>
            </div>
          ))}
        </div>
        <div className="border-t border-[#F3F4F6] pt-3">
          {events.length === 0 ? (
            <p className="text-sm text-[#6B7280]">Sin eventos aún. Configurá el webhook de Railway (y opcionalmente Vercel Drains) apuntando a <code className="text-[#5471FF]">/ops/ingest/&#123;source&#125;</code>.</p>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-96 overflow-y-auto">
              {events.map(ev => (
                <div key={ev.id} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-[#FAFAFB]">
                  <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${KIND_STYLE[ev.kind] ?? KIND_STYLE.log}`}>{ev.kind}</span>
                  {ev.level === 'error' && <span className="shrink-0 h-2 w-2 rounded-full bg-[#EF4444]" />}
                  <span className="shrink-0 text-xs font-medium text-[#374151] w-12">{ev.app ?? ev.source}</span>
                  <span className="flex-1 truncate text-[#4B5563]">{ev.message || '—'}</span>
                  <span className="shrink-0 text-xs text-[#9CA3AF]">{whenLabel(ev.occurred_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>

      <div className="grid lg:grid-cols-2 gap-6">
        <Section title="Apps monitoreadas">
          <p className="text-sm text-[#6B7280]">Conjunto fijo de apps en producción (Vercel / Railway).</p>
          <div className="flex flex-col gap-2">
            {apps.map(app => (
              <div key={app.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#E5E7EB] px-4 py-3 text-sm">
                <div>
                  <span className="font-medium">{app.name}</span>
                  <span className="text-[#6B7280]"> · {app.base_url}{app.health_path}</span>
                </div>
                <span className={`text-xs font-semibold ${app.enabled ? 'text-[#166534]' : 'text-[#9CA3AF]'}`}>{app.enabled ? 'ON' : 'OFF'}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Alertas">
          <form onSubmit={submitAlert} className="grid grid-cols-2 gap-3">
            <Field label="Nombre">
              <Input value={alertForm.name} onChange={e => setAlertForm(v => ({ ...v, name: e.target.value }))} required />
            </Field>
            <Field label="App">
              <Select value={alertForm.app_id} onChange={e => setAlertForm(v => ({ ...v, app_id: e.target.value }))}>
                <option value="">Global</option>
                {apps.map(app => <option key={app.id} value={app.id}>{app.name}</option>)}
              </Select>
            </Field>
            <Field label="Max latency (ms)">
              <Input type="number" value={alertForm.max_latency_ms} onChange={e => setAlertForm(v => ({ ...v, max_latency_ms: Number(e.target.value) }))} />
            </Field>
            <Field label="Min uptime %">
              <Input type="number" value={alertForm.min_uptime_percent} onChange={e => setAlertForm(v => ({ ...v, min_uptime_percent: Number(e.target.value) }))} />
            </Field>
            <Field label="Min RPS">
              <Input type="number" value={alertForm.min_rps} onChange={e => setAlertForm(v => ({ ...v, min_rps: Number(e.target.value) }))} />
            </Field>
            <div className="flex items-end">
              <Button type="submit" variant="dark" className="w-full">Crear alerta</Button>
            </div>
          </form>
          <div className="flex flex-col gap-2">
            {alerts.length === 0 ? (
              <p className="text-sm text-[#6B7280]">Sin alertas configuradas.</p>
            ) : alerts.map(alert => (
              <div key={alert.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#E5E7EB] px-4 py-3 text-sm">
                <div>
                  <strong>{alert.name}</strong>
                  <span className="text-[#6B7280]"> · {alert.app_name || 'global'} · latency {alert.max_latency_ms ?? '—'}ms · uptime {alert.min_uptime_percent ?? '—'}%</span>
                </div>
                <button className="text-[#DC2626] hover:underline" onClick={() => run(() => ops.deleteAlert(alert.id), 'Alerta eliminada')}>Eliminar</button>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}
