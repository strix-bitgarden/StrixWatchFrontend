'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ops,
  type Admin,
  type Business,
  type Membership,
  type MembershipPayload,
} from '@/lib/ops'
import { PageHeader, Section, StatusBadge, Field, Input, Select, Button, Toast } from '@/components/ui'

interface EditForm {
  name: string
  address: string
  phone: string
  rut: string
  owner_id: string
}

const emptyMembership: Omit<MembershipPayload, 'business_id'> = {
  plan_name: 'growth',
  price_amount: 49,
  trial_days: 14,
  discount_percent: 10,
  payment_status: 'pending',
}

export default function LocalDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id

  const [business, setBusiness] = useState<Business | null>(null)
  const [admins, setAdmins] = useState<Admin[]>([])
  const [membership, setMembership] = useState<Membership | null>(null)
  const [form, setForm] = useState<EditForm | null>(null)
  const [membershipForm, setMembershipForm] = useState(emptyMembership)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setError('')
    const [biz, adminList, memberships] = await Promise.all([
      ops.business(id),
      ops.admins(),
      ops.memberships(),
    ])
    if (!biz) { setError('Local no encontrado.'); setLoading(false); return }
    setBusiness(biz)
    setAdmins(adminList)
    setMembership(memberships.find(m => m.business_id === id) ?? null)
    setForm({
      name: biz.name,
      address: biz.address ?? '',
      phone: biz.phone ?? '',
      rut: biz.rut ?? '',
      owner_id: biz.owner.id,
    })
    setLoading(false)
  }, [id])

  useEffect(() => {
    load().catch(err => { setError(err instanceof Error ? err.message : 'Error cargando local'); setLoading(false) })
  }, [load])

  async function run(action: () => Promise<unknown>, okMessage: string) {
    setError('')
    setMessage('')
    setSaving(true)
    try {
      await action()
      setMessage(okMessage)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error')
    } finally {
      setSaving(false)
    }
  }

  async function saveDetails(e: FormEvent) {
    e.preventDefault()
    if (!form) return
    if (!form.owner_id) {
      setError('Seleccioná un admin como owner antes de guardar.')
      return
    }
    await run(() => ops.updateBusiness(id, {
      name: form.name,
      address: form.address || null,
      phone: form.phone || null,
      rut: form.rut || null,
      owner_id: form.owner_id,
    }), 'Cambios guardados')
  }

  async function saveMembership(e: FormEvent) {
    e.preventDefault()
    await run(() => ops.assignMembership({ ...membershipForm, business_id: id }), 'Membresía actualizada')
  }

  async function remove() {
    if (!confirm('¿Eliminar este local? Quedará marcado como eliminado.')) return
    await run(async () => { await ops.deleteBusiness(id) }, 'Local eliminado')
  }

  if (loading) return <p className="text-sm text-[#6B7280]">Cargando…</p>
  if (!business || !form) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col gap-4">
        <Toast message={error || 'Local no encontrado.'} tone="error" />
        <Link href="/dashboard/locales" className="text-[#5471FF] underline">← Volver a locales</Link>
      </div>
    )
  }

  const activeAdmins = admins.filter(a => a.status !== 'deleted')
  const ownerIsAdmin = activeAdmins.some(a => a.id === form.owner_id)

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <Link href="/dashboard/locales" className="text-sm text-[#6B7280] hover:text-[#111827]">← Locales</Link>
      <PageHeader
        title={business.name}
        subtitle={`Owner: ${business.owner.name} · ${business.owner.email}`}
        action={<StatusBadge status={business.status} />}
      />
      <Toast message={message} />
      <Toast message={error} tone="error" />

      <div className="grid lg:grid-cols-2 gap-6">
        <Section title="Datos del local">
          <form onSubmit={saveDetails} className="grid gap-4">
            <Field label="Nombre">
              <Input value={form.name} onChange={e => setForm(v => v && { ...v, name: e.target.value })} required />
            </Field>
            <Field label="Dirección">
              <Input value={form.address} onChange={e => setForm(v => v && { ...v, address: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Teléfono">
                <Input value={form.phone} onChange={e => setForm(v => v && { ...v, phone: e.target.value })} />
              </Field>
              <Field label="RUT">
                <Input value={form.rut} onChange={e => setForm(v => v && { ...v, rut: e.target.value })} />
              </Field>
            </div>
            <Field label="Owner (admin)">
              <Select value={ownerIsAdmin ? form.owner_id : ''} onChange={e => setForm(v => v && { ...v, owner_id: e.target.value })}>
                <option value="" disabled>
                  {ownerIsAdmin
                    ? '— Seleccionar admin —'
                    : `Owner actual: ${business.owner.email} (no es admin) — elegí uno`}
                </option>
                {activeAdmins.map(a => <option key={a.id} value={a.id}>{a.name} — {a.email}</option>)}
              </Select>
            </Field>
            {!ownerIsAdmin && (
              <p className="text-xs text-[#DC2626]">
                El owner actual ({business.owner.email}) no es un admin válido. Elegí un admin para corregirlo.
              </p>
            )}
            <p className="text-xs text-[#9CA3AF]">La configuración de fidelidad (sellos, premios) se administra desde el panel del comercio.</p>
            <Button type="submit" disabled={saving}>Guardar cambios</Button>
          </form>
        </Section>

        <div className="flex flex-col gap-6">
          <Section title="Membresía">
            {membership ? (
              <div className="rounded-2xl border border-[#E5E7EB] p-4 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold capitalize">{membership.plan_name}</span>
                  <StatusBadge status={membership.status} />
                </div>
                <div className="text-sm text-[#6B7280]">Precio ${membership.price_amount} · Descuento {membership.discount_percent}%</div>
                <div className="text-sm text-[#6B7280]">Clientes: {membership.consumption.clients} · Tarjetas: {membership.consumption.cards}</div>
                <div className="text-sm text-[#6B7280]">
                  Pagos — efectuados {membership.payments.efectuados}, pendientes {membership.payments.pendientes}, atrasados {membership.payments.atrasados}
                </div>
                {membership.status !== 'cancelled' && (
                  <button
                    className="text-sm text-[#DC2626] hover:underline self-start mt-2"
                    onClick={() => run(() => ops.cancelMembership(id), 'Membresía cancelada')}
                  >
                    Cancelar membresía
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-[#6B7280]">Este local no tiene membresía asignada.</p>
            )}

            <form onSubmit={saveMembership} className="grid grid-cols-2 gap-3 border-t border-[#F3F4F6] pt-4">
              <Field label="Plan">
                <Input value={membershipForm.plan_name} onChange={e => setMembershipForm(v => ({ ...v, plan_name: e.target.value }))} />
              </Field>
              <Field label="Precio">
                <Input type="number" value={membershipForm.price_amount} onChange={e => setMembershipForm(v => ({ ...v, price_amount: Number(e.target.value) }))} />
              </Field>
              <Field label="Trial (días)">
                <Input type="number" value={membershipForm.trial_days} onChange={e => setMembershipForm(v => ({ ...v, trial_days: Number(e.target.value) }))} />
              </Field>
              <Field label="Descuento %">
                <Input type="number" value={membershipForm.discount_percent} onChange={e => setMembershipForm(v => ({ ...v, discount_percent: Number(e.target.value) }))} />
              </Field>
              <Field label="Estado de pago">
                <Select value={membershipForm.payment_status} onChange={e => setMembershipForm(v => ({ ...v, payment_status: e.target.value }))}>
                  <option value="pending">Pendiente</option>
                  <option value="paid">Efectuado</option>
                  <option value="overdue">Atrasado</option>
                </Select>
              </Field>
              <div className="flex items-end">
                <Button type="submit" variant="dark" className="w-full" disabled={saving}>
                  {membership ? 'Actualizar' : 'Asignar'}
                </Button>
              </div>
            </form>
          </Section>

          <Section title="Ciclo de vida">
            <div className="flex flex-wrap gap-3">
              {business.status !== 'active' ? (
                <Button
                  variant="primary"
                  disabled={saving}
                  onClick={() => run(() => ops.activateBusiness(id), 'Local activado')}
                >
                  Activar local
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  disabled={saving}
                  onClick={() => run(() => ops.pauseBusiness(id), 'Local pausado')}
                >
                  Pausar local
                </Button>
              )}
              <Button
                variant="danger"
                disabled={saving || business.status === 'deleted'}
                onClick={remove}
              >
                Eliminar local
              </Button>
            </div>
            <p className="text-xs text-[#9CA3AF]">Pausar deshabilita el local sin borrar sus datos. Activar lo vuelve a habilitar (y restaura los eliminados). Eliminar lo marca como eliminado.</p>
          </Section>
        </div>
      </div>
    </div>
  )
}
