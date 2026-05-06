'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import type { Address } from '@/types'

const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

interface AddressManagerProps {
  addresses: Address[]
  customerId: string
}

const BLANK = { line1: '', line2: '', city: '', state: 'NJ', postal_code: '', delivery_instructions: '' }

export function AddressManager({ addresses: initial, customerId }: AddressManagerProps) {
  const router   = useRouter()
  const [list, setList]     = useState(initial)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [form, setForm]     = useState(BLANK)
  const [error, setError]   = useState('')

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerId) return
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { data, error: err } = await supabase
      .from('addresses')
      .insert({ ...form, customer_id: customerId, country: 'US' })
      .select()
      .single()
    setSaving(false)
    if (err) { setError(err.message); return }
    setList((prev) => [data as Address, ...prev])
    setForm(BLANK)
    setAdding(false)
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    const supabase = createClient()
    await supabase.from('addresses').delete().eq('id', id)
    setList((prev) => prev.filter((a) => a.id !== id))
    setDeleting(null)
  }

  return (
    <div className="space-y-4">
      {list.length === 0 && !adding && (
        <div className="text-center py-8">
          <MapPin className="h-8 w-8 text-gray-200 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">No saved addresses yet.</p>
        </div>
      )}

      {list.map((addr) => (
        <div key={addr.id} className="flex items-start justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
          <div className="text-sm space-y-0.5">
            <p className="font-medium text-brand-charcoal">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
            <p className="text-gray-500">{addr.city}, {addr.state} {addr.postal_code}</p>
            {addr.delivery_instructions && <p className="text-gray-400 italic">{addr.delivery_instructions}</p>}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(addr.id)}
            disabled={deleting === addr.id}
            className="text-red-500 hover:text-red-600 border-red-100 hover:border-red-200 hover:bg-red-50"
          >
            {deleting === addr.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      ))}

      {adding ? (
        <form onSubmit={handleAdd} className="border border-gray-200 rounded-xl p-5 space-y-3 bg-gray-50">
          <h3 className="font-medium text-sm text-brand-charcoal">New Address</h3>
          <div className="space-y-2">
            <Label className="text-xs">Street Address *</Label>
            <Input required value={form.line1} onChange={(e) => set('line1', e.target.value)} placeholder="123 Main St" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Apt / Suite</Label>
            <Input value={form.line2} onChange={(e) => set('line2', e.target.value)} placeholder="Apt 2B" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">City *</Label>
              <Input required value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Paterson" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">ZIP *</Label>
              <Input required value={form.postal_code} onChange={(e) => set('postal_code', e.target.value)} placeholder="07501" maxLength={5} />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">State</Label>
            <select
              value={form.state}
              onChange={(e) => set('state', e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Delivery Instructions</Label>
            <Input value={form.delivery_instructions} onChange={(e) => set('delivery_instructions', e.target.value)} placeholder="Ring bell, leave at door..." />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Address'}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => { setAdding(false); setError('') }}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" onClick={() => setAdding(true)} className="w-full border-dashed">
          <Plus className="h-4 w-4" /> Add New Address
        </Button>
      )}
    </div>
  )
}
