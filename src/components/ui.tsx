import type { EntityStatus } from '@/lib/ops'

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#111827]">{title}</h1>
        {subtitle ? <p className="text-sm text-[#6B7280] mt-1">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function Section({ title, children, action }: { title?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="bg-white border border-[#E5E7EB] rounded-3xl p-5 md:p-6 flex flex-col gap-4 shadow-sm">
      {(title || action) && (
        <div className="flex items-center justify-between gap-4">
          {title ? <h2 className="text-lg font-bold">{title}</h2> : <span />}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function Metric({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4">
      <div className="text-sm text-[#6B7280]">{label}</div>
      <div className="text-3xl font-bold mt-1 text-[#111827]">{value}</div>
      {hint ? <div className="text-xs text-[#9CA3AF] mt-1">{hint}</div> : null}
    </div>
  )
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-[#DCFCE7] text-[#166534]',
  paused: 'bg-[#FEF3C7] text-[#92400E]',
  deleted: 'bg-[#FEE2E2] text-[#991B1B]',
  trialing: 'bg-[#DBEAFE] text-[#1E40AF]',
  cancelled: 'bg-[#F3F4F6] text-[#6B7280]',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  paused: 'Pausado',
  deleted: 'Eliminado',
  trialing: 'Trial',
  cancelled: 'Cancelado',
}

export function StatusBadge({ status }: { status: EntityStatus | string }) {
  const style = STATUS_STYLES[status] ?? 'bg-[#F3F4F6] text-[#6B7280]'
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${style}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-[#374151]">{label}</span>
      {children}
    </label>
  )
}

const INPUT = 'h-11 rounded-xl border border-[#D1D5DB] px-3 outline-none focus:border-[#5471FF] focus:ring-2 focus:ring-[#5471FF]/20 transition'

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${INPUT} ${props.className ?? ''}`} />
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${INPUT} bg-white ${props.className ?? ''}`} />
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'dark' | 'ghost' | 'danger' }) {
  const styles: Record<string, string> = {
    primary: 'bg-[#5471FF] text-white hover:bg-[#3f5cf0]',
    dark: 'bg-[#111827] text-white hover:bg-black',
    ghost: 'bg-white text-[#374151] border border-[#D1D5DB] hover:bg-[#F9FAFB]',
    danger: 'bg-white text-[#DC2626] border border-[#FCA5A5] hover:bg-[#FEF2F2]',
  }
  return (
    <button
      {...props}
      className={`h-11 rounded-xl px-4 font-semibold disabled:opacity-50 transition ${styles[variant]} ${className}`}
    />
  )
}

export function Toast({ message, tone = 'info' }: { message: string; tone?: 'info' | 'error' }) {
  if (!message) return null
  const style = tone === 'error'
    ? 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
    : 'bg-[#EEF2FF] border-[#C7D2FE] text-[#3730A3]'
  return <div className={`rounded-2xl border px-4 py-3 text-sm ${style}`} role="status">{message}</div>
}
