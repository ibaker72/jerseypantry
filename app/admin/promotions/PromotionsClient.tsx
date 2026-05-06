'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tag, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Promotion, PromotionType } from '@/types'

interface Props {
  initialPromos: Promotion[]
  categories: Array<{ id: string; name: string }>
}

const TYPE_LABELS: Record<PromotionType, string> = {
  bogo: 'BOGO (Buy X Get Y Free)',
  category_percent: 'Category % Discount',
  spend_threshold: 'Spend $X Get $Y Off',
  free_shipping: 'Free Shipping Threshold',
}

const EMPTY: {
  name: string; description: string; type: PromotionType;
  starts_at: string; ends_at: string; max_uses: string
  // bogo
  buy_qty: string; get_qty: string
  // category
  category_id: string; percent: string
  // spend
  min_spend: string; discount_fixed: string
  // free_shipping
  fs_min_spend: string
} = {
  name: '', description: '', type: 'spend_threshold',
  starts_at: '', ends_at: '', max_uses: '',
  buy_qty: '2', get_qty: '1',
  category_id: '', percent: '15',
  min_spend: '75', discount_fixed: '10',
  fs_min_spend: '50',
}

function conditionsLabel(promo: Promotion): string {
  const c = promo.conditions as Record<string, unknown>
  switch (promo.type) {
    case 'bogo': return `Buy ${c.buy_qty}, get ${c.get_qty} free`
    case 'category_percent': return `${c.percent}% off category`
    case 'spend_threshold': return `Spend $${c.min_spend}, save $${c.discount_fixed}`
    case 'free_shipping': return `Free shipping over $${c.min_spend}`
  }
}

function isActive(promo: Promotion): boolean {
  if (!promo.is_active) return false
  const now = Date.now()
  if (promo.starts_at && new Date(promo.starts_at).getTime() > now) return false
  if (promo.ends_at && new Date(promo.ends_at).getTime() < now) return false
  return true
}

export function PromotionsClient({ initialPromos, categories }: Props) {
  const router = useRouter()
  const [promos, setPromos] = useState(initialPromos)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function buildConditions(): Record<string, unknown> {
    switch (form.type) {
      case 'bogo':             return { buy_qty: Number(form.buy_qty), get_qty: Number(form.get_qty) }
      case 'category_percent': return { category_id: form.category_id, percent: Number(form.percent) }
      case 'spend_threshold':  return { min_spend: Number(form.min_spend), discount_fixed: Number(form.discount_fixed) }
      case 'free_shipping':    return { min_spend: Number(form.fs_min_spend) }
      default:                 return {}
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.name) { setError('Name is required'); return }
    if (form.type === 'category_percent' && !form.category_id) { setError('Select a category'); return }

    setSaving(true)
    const payload = {
      name: form.name,
      description: form.description || null,
      type: form.type,
      conditions: buildConditions(),
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      ends_at:   form.ends_at   ? new Date(form.ends_at).toISOString()   : null,
      max_uses:  form.max_uses  ? Number(form.max_uses) : null,
      is_active: true,
    }

    const res = await fetch('/api/admin/promotions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed to create'); setSaving(false); return }

    setPromos((prev) => [data.promo, ...prev])
    setForm(EMPTY)
    setShowForm(false)
    setSaving(false)
    router.refresh()
  }

  async function toggleActive(promo: Promotion) {
    const res = await fetch(`/api/admin/promotions/${promo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !promo.is_active }),
    })
    if (res.ok) setPromos((p) => p.map((pr) => pr.id === promo.id ? { ...pr, is_active: !pr.is_active } : pr))
  }

  async function deletePromo(id: string) {
    if (!confirm('Delete this promotion?')) return
    const res = await fetch(`/api/admin/promotions/${id}`, { method: 'DELETE' })
    if (res.ok) setPromos((p) => p.filter((pr) => pr.id !== id))
  }

  const activePromos = promos.filter(isActive)
  const inactivePromos = promos.filter((p) => !isActive(p))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-charcoal flex items-center gap-2">
            <Tag className="h-6 w-6 text-brand-green" /> Promotions
          </h1>
          <p className="text-gray-500 text-sm mt-1">BOGO, category discounts, spend thresholds — auto-applied at checkout</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} className="gap-2">
          <Plus className="h-4 w-4" /> New Promotion
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-brand-charcoal">New Promotion</h2>
          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Summer Sale" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as PromotionType })}>
                {(Object.entries(TYPE_LABELS) as [PromotionType, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description shown to customers" />
          </div>

          {/* Type-specific fields */}
          {form.type === 'bogo' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buy Qty</label>
                <Input type="number" min="1" value={form.buy_qty} onChange={(e) => setForm({ ...form, buy_qty: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Get Qty Free</label>
                <Input type="number" min="1" value={form.get_qty} onChange={(e) => setForm({ ...form, get_qty: e.target.value })} />
              </div>
            </div>
          )}

          {form.type === 'category_percent' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label>
                <Input type="number" min="1" max="100" value={form.percent} onChange={(e) => setForm({ ...form, percent: e.target.value })} />
              </div>
            </div>
          )}

          {form.type === 'spend_threshold' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Spend ($)</label>
                <Input type="number" min="0" step="0.01" value={form.min_spend} onChange={(e) => setForm({ ...form, min_spend: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount ($)</label>
                <Input type="number" min="0" step="0.01" value={form.discount_fixed} onChange={(e) => setForm({ ...form, discount_fixed: e.target.value })} />
              </div>
            </div>
          )}

          {form.type === 'free_shipping' && (
            <div className="max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Spend for Free Shipping ($)</label>
              <Input type="number" min="0" step="0.01" value={form.fs_min_spend} onChange={(e) => setForm({ ...form, fs_min_spend: e.target.value })} />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Starts At (optional)</label>
              <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ends At (optional)</label>
              <Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses (optional)</label>
              <Input type="number" min="1" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} placeholder="Unlimited" />
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create Promotion'}</Button>
            <Button type="button" variant="outline" onClick={() => { setShowForm(false); setError(null) }}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-brand-charcoal">Active ({activePromos.length})</h2>
        </div>
        {activePromos.length === 0 ? (
          <p className="text-gray-400 text-sm p-6">No active promotions.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {activePromos.map((promo) => (
              <div key={promo.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="bg-brand-green/10 text-brand-green text-xs font-bold px-2 py-0.5 rounded-full">{TYPE_LABELS[promo.type]}</span>
                    <span className="font-medium text-sm text-brand-charcoal">{promo.name}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{conditionsLabel(promo)}</p>
                  {promo.max_uses && <p className="text-xs text-gray-400 mt-0.5">{promo.usage_count}/{promo.max_uses} uses</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleActive(promo)}><ToggleRight className="h-5 w-5 text-brand-green" /></button>
                  <button onClick={() => deletePromo(promo.id)}><Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {inactivePromos.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-400">Inactive / Expired ({inactivePromos.length})</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {inactivePromos.map((promo) => (
              <div key={promo.id} className="px-6 py-4 flex items-center justify-between gap-4 opacity-60">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-brand-charcoal">{promo.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{conditionsLabel(promo)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleActive(promo)}><ToggleLeft className="h-5 w-5 text-gray-400 hover:text-brand-green" /></button>
                  <button onClick={() => deletePromo(promo.id)}><Trash2 className="h-4 w-4 text-red-300 hover:text-red-600" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
