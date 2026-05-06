'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { B2BPlan, B2BBillingType } from '@/types'

const PLAN_OPTIONS: { value: B2BPlan; label: string }[] = [
  { value: 'starter', label: 'Starter — $99/mo' },
  { value: 'standard', label: 'Standard — $199/mo' },
  { value: 'premium', label: 'Premium — $399/mo' },
]

const BUSINESS_TYPES = [
  'Auto Dealership', 'Barbershop / Salon', 'Gym / Fitness Center',
  'Corporate Office', 'Medical / Dental Office', 'Real Estate Office',
  'Mechanic Shop', 'Retail Store', 'Restaurant / Café', 'Other',
]

export default function NewB2BAccountPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    business_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    business_type: '',
    plan_name: 'starter' as B2BPlan,
    billing_type: 'card' as B2BBillingType,
    delivery_notes: '',
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/b2b/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(`/admin/b2b/accounts/${data.id}`)
    } catch (err: any) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <Link
        href="/admin/b2b/accounts"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-charcoal mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to B2B Accounts
      </Link>

      <h1 className="text-2xl font-bold text-brand-charcoal mb-6">New Business Account</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Business Name *</label>
            <input required value={form.business_name} onChange={set('business_name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              placeholder="Acme Corp" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Business Type</label>
            <select value={form.business_type} onChange={set('business_type')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30">
              <option value="">Select…</option>
              {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Contact Name</label>
            <input value={form.contact_name} onChange={set('contact_name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              placeholder="Jane Smith" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Contact Email *</label>
            <input required type="email" value={form.contact_email} onChange={set('contact_email')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              placeholder="jane@acme.com" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
            <input type="tel" value={form.contact_phone} onChange={set('contact_phone')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              placeholder="(973) 555-0100" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Plan</label>
            <select value={form.plan_name} onChange={set('plan_name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30">
              {PLAN_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Billing Type</label>
            <select value={form.billing_type} onChange={set('billing_type')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30">
              <option value="card">Credit Card</option>
              <option value="net30">Net-30 Invoice</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Delivery Notes</label>
          <textarea rows={3} value={form.delivery_notes} onChange={set('delivery_notes')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 resize-none"
            placeholder="Gate code, preferred delivery window, special instructions…" />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-brand-green text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? 'Creating…' : 'Create Account'}
          </button>
          <Link href="/admin/b2b/accounts"
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
