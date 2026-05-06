'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Plus, Trash2, ToggleLeft, ToggleRight, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatPrice } from '@/lib/utils/format'
import type { FlashSale } from '@/types'

interface Props {
  initialSales: FlashSale[]
  products: Array<{ id: string; name: string; sku: string | null; retail_price: number }>
  categories: Array<{ id: string; name: string }>
}

const EMPTY_FORM = {
  title: '',
  badge_label: 'FLASH SALE',
  scope: 'product' as 'product' | 'category' | 'sitewide',
  product_id: '',
  category_id: '',
  discount_type: 'percent' as 'percent' | 'fixed',
  discount_value: '',
  max_discount: '',
  starts_at: new Date().toISOString().slice(0, 16),
  ends_at: '',
}

export function FlashSalesClient({ initialSales, products, categories }: Props) {
  const router = useRouter()
  const [sales, setSales] = useState(initialSales)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const now = new Date()
  const activeSales = sales.filter((s) => s.is_active && new Date(s.ends_at) > now)
  const pastSales = sales.filter((s) => !s.is_active || new Date(s.ends_at) <= now)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.title || !form.ends_at || !form.discount_value) {
      setError('Title, end date, and discount are required.')
      return
    }
    if (form.scope === 'product' && !form.product_id) {
      setError('Select a product.')
      return
    }
    if (form.scope === 'category' && !form.category_id) {
      setError('Select a category.')
      return
    }

    setSaving(true)
    const payload = {
      title: form.title,
      badge_label: form.badge_label,
      product_id:  form.scope === 'product'  ? form.product_id  : null,
      category_id: form.scope === 'category' ? form.category_id : null,
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      max_discount: form.max_discount ? parseFloat(form.max_discount) : null,
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: new Date(form.ends_at).toISOString(),
      is_active: true,
    }

    const res = await fetch('/api/admin/flash-sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed to create flash sale'); setSaving(false); return }

    setSales((prev) => [data.sale, ...prev])
    setForm(EMPTY_FORM)
    setShowForm(false)
    setSaving(false)
    router.refresh()
  }

  async function toggleActive(sale: FlashSale) {
    const res = await fetch(`/api/admin/flash-sales/${sale.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !sale.is_active }),
    })
    if (res.ok) {
      setSales((prev) => prev.map((s) => s.id === sale.id ? { ...s, is_active: !s.is_active } : s))
    }
  }

  async function deleteSale(id: string) {
    if (!confirm('Delete this flash sale?')) return
    const res = await fetch(`/api/admin/flash-sales/${id}`, { method: 'DELETE' })
    if (res.ok) setSales((prev) => prev.filter((s) => s.id !== id))
  }

  function scopeLabel(sale: FlashSale) {
    if (sale.product_id) {
      return products.find((p) => p.id === sale.product_id)?.name ?? 'Product'
    }
    if (sale.category_id) {
      return `${categories.find((c) => c.id === sale.category_id)?.name ?? 'Category'} (category)`
    }
    return 'Site-wide'
  }

  function discountLabel(sale: FlashSale) {
    return sale.discount_type === 'percent'
      ? `${sale.discount_value}% off${sale.max_discount ? ` (max ${formatPrice(sale.max_discount)})` : ''}`
      : `${formatPrice(sale.discount_value)} off`
  }

  function timeLeft(endsAt: string) {
    const diff = new Date(endsAt).getTime() - Date.now()
    if (diff <= 0) return 'Ended'
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return h > 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : `${h}h ${m}m`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-charcoal flex items-center gap-2">
            <Zap className="h-6 w-6 text-brand-orange" /> Flash Sales
          </h1>
          <p className="text-gray-500 text-sm mt-1">Time-limited deals with countdown timers on the storefront</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} className="gap-2">
          <Plus className="h-4 w-4" /> New Flash Sale
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-brand-charcoal">New Flash Sale</h2>
          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Weekend Flash Sale" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Badge Label</label>
              <Input value={form.badge_label} onChange={(e) => setForm({ ...form, badge_label: e.target.value })} placeholder="FLASH SALE" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.scope}
              onChange={(e) => setForm({ ...form, scope: e.target.value as typeof form.scope })}
            >
              <option value="product">Specific Product</option>
              <option value="category">Entire Category</option>
              <option value="sitewide">Site-wide</option>
            </select>
          </div>

          {form.scope === 'product' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}>
                <option value="">Select a product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {formatPrice(p.retail_price)}</option>
                ))}
              </select>
            </div>
          )}

          {form.scope === 'category' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value as 'percent' | 'fixed' })}>
                <option value="percent">Percent off (%)</option>
                <option value="fixed">Fixed amount ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {form.discount_type === 'percent' ? 'Percent (e.g. 20)' : 'Amount (e.g. 5.00)'}
              </label>
              <Input type="number" min="0.01" step="0.01" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} required />
            </div>
            {form.discount_type === 'percent' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount $ (optional)</label>
                <Input type="number" min="0" step="0.01" value={form.max_discount} onChange={(e) => setForm({ ...form, max_discount: e.target.value })} placeholder="No cap" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Starts At</label>
              <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ends At</label>
              <Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} required />
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create Flash Sale'}</Button>
            <Button type="button" variant="outline" onClick={() => { setShowForm(false); setError(null) }}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Active sales */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-brand-charcoal">Active Sales ({activeSales.length})</h2>
        </div>
        {activeSales.length === 0 ? (
          <p className="text-gray-400 text-sm p-6">No active flash sales. Create one above.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {activeSales.map((sale) => (
              <div key={sale.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="bg-brand-orange text-white text-xs font-bold px-2 py-0.5 rounded-full">{sale.badge_label}</span>
                    <span className="font-medium text-brand-charcoal text-sm">{sale.title}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{scopeLabel(sale)} · {discountLabel(sale)}</p>
                  <p className="text-xs text-brand-orange mt-0.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {timeLeft(sale.ends_at)} remaining
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleActive(sale)} title="Toggle active">
                    <ToggleRight className="h-5 w-5 text-brand-green" />
                  </button>
                  <button onClick={() => deleteSale(sale.id)} title="Delete">
                    <Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past / inactive */}
      {pastSales.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-400">Past / Inactive ({pastSales.length})</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {pastSales.map((sale) => (
              <div key={sale.id} className="px-6 py-4 flex items-center justify-between gap-4 opacity-60">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-brand-charcoal text-sm">{sale.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{scopeLabel(sale)} · {discountLabel(sale)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Ended {new Date(sale.ends_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleActive(sale)} title="Reactivate">
                    <ToggleLeft className="h-5 w-5 text-gray-400 hover:text-brand-green" />
                  </button>
                  <button onClick={() => deleteSale(sale.id)} title="Delete">
                    <Trash2 className="h-4 w-4 text-red-300 hover:text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
