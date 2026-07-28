import { apiFetch } from '@/lib/api'

// ── Types ─────────────────────────────────────────────────────────────────

export interface Summary {
  businesses: number
  active_businesses: number
  admins: number
  memberships: number
  alerts: number
  monitored_apps: number
}

export interface Owner {
  id: string
  name: string
  email: string
}

export type EntityStatus = 'active' | 'paused' | 'deleted'

export interface Business {
  id: string
  name: string
  address?: string | null
  phone?: string | null
  rut?: string | null
  active: boolean
  deleted_at?: string | null
  status: EntityStatus
  owner: Owner
  trial_ends_at?: string | null
  created_at: string
}

export interface Admin {
  id: string
  name: string
  email: string
  active: boolean
  deleted_at?: string | null
  status: EntityStatus
  created_at: string
}

export interface Membership {
  id: string
  business_id: string
  business_name: string
  plan_name: string
  status: string
  trial_ends_at?: string | null
  discount_percent: number
  price_amount: number
  current_period_start?: string | null
  current_period_end?: string | null
  cancelled_at?: string | null
  consumption: { clients: number; cards: number }
  payments: { efectuados: number; pendientes: number; atrasados: number }
}

export interface MonitoredApp {
  id: string
  key: string
  name: string
  base_url: string
  health_path: string
  enabled: boolean
}

export interface MonitoringSummary {
  app_id: string
  key: string
  name: string
  base_url: string
  uptime_percent?: number | null
  rps: number
  origins: string[]
  percentiles: { p50?: number | null; p90?: number | null; p95?: number | null; p99?: number | null }
  latest_check?: string | null
  latest_error?: string | null
}

export interface ObservabilityEvent {
  id: string
  source: string
  app: string | null
  kind: string
  level: 'info' | 'warn' | 'error' | string
  status_code?: number | null
  latency_ms?: number | null
  message?: string | null
  occurred_at: string
}

export interface ObservabilitySummary {
  app: string
  errors_24h: number
  last_deploy?: string | null
  last_crash?: string | null
}

export interface AlertRule {
  id: string
  name: string
  channel: string
  enabled: boolean
  app_id?: string | null
  app_name?: string | null
  max_latency_ms?: number | null
  min_uptime_percent?: number | null
  min_rps?: number | null
}

// ── Payloads ────────────────────────────────────────────────────────────────

export interface BusinessPayload {
  name: string
  address?: string | null
  phone?: string | null
  rut?: string | null
  owner_id?: string
  stamps_required?: number
  reward_description?: string | null
  min_price_per_stamp?: number
}

export interface AdminPayload {
  name: string
  email: string
  password: string
  business_id?: string | null
}

export interface MembershipPayload {
  business_id: string
  plan_name: string
  price_amount: number
  trial_days: number
  discount_percent: number
  payment_status: string
}

export interface AlertPayload {
  name: string
  app_id?: string | null
  channel: string
  max_latency_ms?: number | null
  min_uptime_percent?: number | null
  min_rps?: number | null
}

export interface MonitoredAppPayload {
  key: string
  name: string
  base_url: string
  health_path: string
  enabled: boolean
}

// ── API namespace ─────────────────────────────────────────────────────────

function post<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) })
}

export const ops = {
  summary: () => apiFetch<Summary>('/ops/summary'),

  businesses: () => apiFetch<Business[]>('/ops/businesses'),
  business: async (id: string): Promise<Business | null> => {
    const list = await apiFetch<Business[]>('/ops/businesses')
    return list.find(b => b.id === id) ?? null
  },
  createBusiness: (payload: BusinessPayload) =>
    post<{ id: string }>('/ops/businesses', payload),
  updateBusiness: (id: string, payload: Partial<BusinessPayload>) =>
    apiFetch<{ id: string; status: string }>(`/ops/businesses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  pauseBusiness: (id: string) => post(`/ops/businesses/${id}/pause`, {}),
  activateBusiness: (id: string) => post(`/ops/businesses/${id}/activate`, {}),
  deleteBusiness: (id: string) =>
    apiFetch(`/ops/businesses/${id}`, { method: 'DELETE' }),

  admins: () => apiFetch<Admin[]>('/ops/admins'),
  createAdmin: (payload: AdminPayload) =>
    post<{ id: string; name: string }>('/ops/admins', payload),

  memberships: () => apiFetch<Membership[]>('/ops/memberships'),
  assignMembership: (payload: MembershipPayload) =>
    post<{ membership_id: string }>('/ops/memberships/assign', payload),
  cancelMembership: (businessId: string) =>
    post(`/ops/memberships/${businessId}/cancel`, {}),

  monitoredApps: () => apiFetch<MonitoredApp[]>('/ops/monitoring/apps'),
  upsertMonitoredApp: (payload: MonitoredAppPayload) =>
    post<{ id: string }>('/ops/monitoring/apps', payload),
  deleteMonitoredApp: (id: string) =>
    apiFetch(`/ops/monitoring/apps/${id}`, { method: 'DELETE' }),
  monitoringSummary: () => apiFetch<MonitoringSummary[]>('/ops/monitoring/summary'),
  runChecks: (sourceLabel = 'watch.dashboard') =>
    post<{ results: unknown[] }>('/ops/monitoring/run', { source_label: sourceLabel }),

  observabilityEvents: (params: { app?: string; kind?: string; level?: string; limit?: number } = {}) => {
    const q = new URLSearchParams()
    if (params.app) q.set('app', params.app)
    if (params.kind) q.set('kind', params.kind)
    if (params.level) q.set('level', params.level)
    if (params.limit) q.set('limit', String(params.limit))
    const qs = q.toString()
    return apiFetch<ObservabilityEvent[]>(`/ops/observability/events${qs ? `?${qs}` : ''}`)
  },
  observabilitySummary: () => apiFetch<ObservabilitySummary[]>('/ops/observability/summary'),

  alerts: () => apiFetch<AlertRule[]>('/ops/alerts'),
  createAlert: (payload: AlertPayload) =>
    post<{ id: string }>('/ops/alerts', { ...payload, app_id: payload.app_id || null }),
  deleteAlert: (id: string) => apiFetch(`/ops/alerts/${id}`, { method: 'DELETE' }),
}
