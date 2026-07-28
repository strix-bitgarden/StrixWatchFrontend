'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ops, type Admin } from '@/lib/ops'
import { PageHeader, Section, Field, Input, Select, Button, Toast } from '@/components/ui'

type OwnerMode = 'existing' | 'new'

const emptyBiz = {
  name: '',
  address: '',
  phone: '',
  rut: '',
  stamps_required: 6,
  min_price_per_stamp: 350,
  reward_description: '',
}

const emptyOwner = { name: '', email: '', password: 'admin1234' }

export default function NuevoLocalPage() {
  const router = useRouter()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [biz, setBiz] = useState(emptyBiz)
  const [ownerMode, setOwnerMode] = useState<OwnerMode>('existing')
  const [ownerId, setOwnerId] = useState('')
  const [owner, setOwner] = useState(emptyOwner)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    ops.admins()
      .then(list => {
        const active = list.filter(a => a.status !== 'deleted')
        setAdmins(active)
        if (active.length === 0) setOwnerMode('new')
        else setOwnerId(active[0].id)
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Error cargando admins'))
  }, [])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      let resolvedOwnerId = ownerId
      if (ownerMode === 'new') {
        if (!owner.name || !owner.email || !owner.password) throw new Error('Completá los datos del nuevo owner.')
        const created = await ops.createAdmin({ name: owner.name, email: owner.email, password: owner.password })
        resolvedOwnerId = created.id
      }
      if (!resolvedOwnerId) throw new Error('Seleccioná o creá un owner admin.')
      if (!biz.name.trim()) throw new Error('El nombre del local es obligatorio.')

      const result = await ops.createBusiness({
        name: biz.name,
        address: biz.address || null,
        phone: biz.phone || null,
        rut: biz.rut || null,
        owner_id: resolvedOwnerId,
        stamps_required: biz.stamps_required,
        min_price_per_stamp: biz.min_price_per_stamp,
        reward_description: biz.reward_description || null,
      })
      router.push(`/dashboard/locales/${result.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el local')
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <PageHeader title="Crear local" subtitle="Alta de un nuevo comercio y su owner." />
      <Toast message={error} tone="error" />

      <form onSubmit={submit} className="flex flex-col gap-6">
        <Section title="Datos del local">
          <Field label="Nombre del local">
            <Input value={biz.name} onChange={e => setBiz(v => ({ ...v, name: e.target.value }))} placeholder="Ej: Club Helados" required />
          </Field>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Dirección">
              <Input value={biz.address} onChange={e => setBiz(v => ({ ...v, address: e.target.value }))} />
            </Field>
            <Field label="Teléfono">
              <Input value={biz.phone} onChange={e => setBiz(v => ({ ...v, phone: e.target.value }))} />
            </Field>
            <Field label="RUT">
              <Input value={biz.rut} onChange={e => setBiz(v => ({ ...v, rut: e.target.value }))} />
            </Field>
            <Field label="Sellos requeridos">
              <Input type="number" min={1} value={biz.stamps_required} onChange={e => setBiz(v => ({ ...v, stamps_required: Number(e.target.value) }))} />
            </Field>
            <Field label="Precio mínimo por sello">
              <Input type="number" min={0} value={biz.min_price_per_stamp} onChange={e => setBiz(v => ({ ...v, min_price_per_stamp: Number(e.target.value) }))} />
            </Field>
            <Field label="Premio">
              <Input value={biz.reward_description} onChange={e => setBiz(v => ({ ...v, reward_description: e.target.value }))} placeholder="Ej: 1 café gratis" />
            </Field>
          </div>
        </Section>

        <Section title="Owner (admin del local)">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOwnerMode('existing')}
              disabled={admins.length === 0}
              className={`h-9 rounded-full px-4 text-sm font-medium transition disabled:opacity-40 ${ownerMode === 'existing' ? 'bg-[#5471FF] text-white' : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'}`}
            >
              Admin existente
            </button>
            <button
              type="button"
              onClick={() => setOwnerMode('new')}
              className={`h-9 rounded-full px-4 text-sm font-medium transition ${ownerMode === 'new' ? 'bg-[#5471FF] text-white' : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'}`}
            >
              Crear admin nuevo
            </button>
          </div>

          {ownerMode === 'existing' ? (
            <Field label="Owner">
              <Select value={ownerId} onChange={e => setOwnerId(e.target.value)}>
                {admins.length === 0 && <option value="">No hay admins — creá uno nuevo</option>}
                {admins.map(a => <option key={a.id} value={a.id}>{a.name} — {a.email}</option>)}
              </Select>
            </Field>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              <Field label="Nombre">
                <Input value={owner.name} onChange={e => setOwner(v => ({ ...v, name: e.target.value }))} />
              </Field>
              <Field label="Email">
                <Input type="email" value={owner.email} onChange={e => setOwner(v => ({ ...v, email: e.target.value }))} />
              </Field>
              <Field label="Contraseña">
                <Input value={owner.password} onChange={e => setOwner(v => ({ ...v, password: e.target.value }))} />
              </Field>
            </div>
          )}
        </Section>

        <div className="flex justify-end">
          <Button type="submit" disabled={submitting}>{submitting ? 'Creando…' : 'Crear local'}</Button>
        </div>
      </form>
    </div>
  )
}
