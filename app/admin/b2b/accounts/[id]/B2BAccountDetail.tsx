'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2, Users, BookOpen, Truck, CreditCard,
  Plus, Trash2, Check, X, Mail,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatPrice } from '@/lib/utils/format'
import type {
  BusinessAccount, BusinessMember, BusinessCatalogItem,
  DeliverySchedule, B2BPlan, B2BBillingType, B2BMemberRole,
} from '@/types'

interface Props {
  account: BusinessAccount
  members: BusinessMember[]
  catalog: BusinessCatalogItem[]
  schedules: DeliverySchedule[]
  allProducts: Array<{ id: string; name: string; retail_price: number; sku: string | null }>
}

const PLAN_LABELS: Record<B2BPlan, string> = {
  starter: 'Starter ($99/mo)', standard: 'Standard ($199/mo)', premium: 'Premium ($399/mo)',
}
const FREQ_LABELS = { weekly: 'Weekly', biweekly: 'Bi-weekly', monthly: 'Monthly' }
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const STATUS_COLORS: Record<string, string> = {
  active: 'text-green-700 bg-green-100', past_due: 'text-red-600 bg-red-100',
  pending: 'text-yellow-700 bg-yellow-100', canceled: 'text-gray-500 bg-gray-100',
}

type Tab = 'overview' | 'catalog' | 'schedule' | 'members'

export function B2BAccountDetail({ account, members, catalog, schedules, allProducts }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [catalogItems, setCatalogItems] = useState(catalog)
  const [memberList, setMemberList] = useState(members)
  const [scheduleList, setScheduleList] = useState(schedules)
  const [saving, setSaving] = useState(false)

  // Catalog state
  const [productSearch, setProductSearch] = useState('')
  const [addingProduct, setAddingProduct] = useState<string | null>(null)
  const [customPriceInput, setCustomPriceInput] = useState('')

  const notInCatalog = useMemo(
    () =>
      allProducts.filter(
        (p) =>
          !catalogItems.find((c) => c.product_id === p.id) &&
          p.name.toLowerCase().includes(productSearch.toLowerCase())
      ),
    [allProducts, catalogItems, productSearch]
  )

  // Schedule state
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [scheduleForm, setScheduleForm] = useState({
    frequency: 'weekly' as 'weekly' | 'biweekly' | 'monthly',
    day_of_week: 1,
    time_window: '10am-12pm',
    notes: '',
  })

  // Members state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<B2BMemberRole>('member')
  const [inviteSpendLimit, setInviteSpendLimit] = useState('')

  // ── Account info update ─────────────────────────────────────
  async function updateAccount(fields: Partial<BusinessAccount>) {
    await fetch(`/api/admin/b2b/accounts/${account.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
    router.refresh()
  }

  // ── Catalog ─────────────────────────────────────────────────
  async function addToCatalog(productId: string) {
    const custom = customPriceInput ? parseFloat(customPriceInput) : null
    const res = await fetch(`/api/admin/b2b/accounts/${account.id}/catalog`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, custom_price: custom }),
    })
    if (res.ok) {
      const data = await res.json()
      setCatalogItems((prev) => [...prev, data.item])
      setAddingProduct(null)
      setCustomPriceInput('')
    }
  }

  async function removeFromCatalog(catalogId: string) {
    const res = await fetch(`/api/admin/b2b/accounts/${account.id}/catalog/${catalogId}`, { method: 'DELETE' })
    if (res.ok) setCatalogItems((prev) => prev.filter((c) => c.id !== catalogId))
  }

  // ── Schedule ─────────────────────────────────────────────────
  async function addSchedule(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/admin/b2b/accounts/${account.id}/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scheduleForm),
    })
    if (res.ok) {
      const data = await res.json()
      setScheduleList((prev) => [...prev, data.schedule])
      setShowScheduleForm(false)
    }
    setSaving(false)
  }

  async function deleteSchedule(id: string) {
    const res = await fetch(`/api/admin/b2b/accounts/${account.id}/schedule/${id}`, { method: 'DELETE' })
    if (res.ok) setScheduleList((prev) => prev.filter((s) => s.id !== id))
  }

  // ── Members ─────────────────────────────────────────────────
  async function inviteMember(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/b2b/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: account.id,
        email: inviteEmail,
        role: inviteRole,
        spend_limit: inviteSpendLimit ? parseFloat(inviteSpendLimit) : null,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      setMemberList((prev) => [...prev, data.member])
      setInviteEmail('')
      setInviteSpendLimit('')
    }
    setSaving(false)
  }

  async function removeMember(id: string) {
    if (!confirm('Remove this member?')) return
    const res = await fetch(`/api/b2b/members/${id}`, { method: 'DELETE' })
    if (res.ok) setMemberList((prev) => prev.filter((m) => m.id !== id))
  }

  const tabs = useMemo<{ key: Tab; label: string; icon: typeof Building2 }[]>(
    () => [
      { key: 'overview', label: 'Overview', icon: Building2 },
      { key: 'catalog',  label: `Catalog (${catalogItems.length})`, icon: BookOpen },
      { key: 'schedule', label: 'Schedule', icon: Truck },
      { key: 'members',  label: `Members (${memberList.length})`, icon: Users },
    ],
    [catalogItems.length, memberList.length]
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-charcoal">{account.business_name}</h1>
          <p className="text-gray-500 text-sm mt-1">{account.contact_email} · {account.business_type ?? '—'}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[account.subscription_status] ?? 'bg-gray-100 text-gray-500'}`}>
            {account.subscription_status}
          </span>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 capitalize">
            {account.plan_name}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === key ? 'bg-white text-brand-charcoal shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />{label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-brand-charcoal flex items-center gap-2"><Building2 className="h-4 w-4" /> Account Details</h2>
            <div className="space-y-2 text-sm">
              {[
                ['Business', account.business_name],
                ['Contact', account.contact_name ?? '—'],
                ['Email', account.contact_email],
                ['Phone', account.contact_phone ?? '—'],
                ['Type', account.business_type ?? '—'],
                ['Billing', account.billing_type === 'net30' ? 'Net-30 Invoice' : 'Credit Card'],
                ['Period End', account.current_period_end ? new Date(account.current_period_end).toLocaleDateString() : '—'],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-brand-charcoal text-right">{val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-brand-charcoal flex items-center gap-2"><CreditCard className="h-4 w-4" /> Plan Settings</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Plan</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  defaultValue={account.plan_name}
                  onChange={(e) => updateAccount({ plan_name: e.target.value as B2BPlan })}
                >
                  {Object.entries(PLAN_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Billing Type</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  defaultValue={account.billing_type}
                  onChange={(e) => updateAccount({ billing_type: e.target.value as B2BBillingType })}
                >
                  <option value="card">Credit Card (auto-charge)</option>
                  <option value="net30">Net-30 Invoice</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Delivery Notes</label>
                <Input
                  defaultValue={account.delivery_notes ?? ''}
                  placeholder="Gate code, loading dock, contact on arrival…"
                  onBlur={(e) => updateAccount({ delivery_notes: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Catalog ── */}
      {tab === 'catalog' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-brand-charcoal">Custom Catalog</h2>
              <p className="text-xs text-gray-400">Custom prices override retail. Leave blank to use retail price.</p>
            </div>

            {catalogItems.length === 0 ? (
              <p className="text-gray-400 text-sm">No products in catalog yet. Add products below.</p>
            ) : (
              <div className="space-y-2 mb-6">
                {catalogItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-brand-charcoal">{item.product?.name ?? item.product_id}</p>
                      <p className="text-xs text-gray-500">
                        Retail: {formatPrice(item.product?.retail_price ?? 0)}
                        {item.custom_price && (
                          <span className="ml-2 text-brand-green font-semibold">
                            Custom: {formatPrice(item.custom_price)}
                          </span>
                        )}
                      </p>
                    </div>
                    <button onClick={() => removeFromCatalog(item.id)}>
                      <Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Add Product</h3>
              <Input
                placeholder="Search products…"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="mb-2"
              />
              <div className="max-h-48 overflow-y-auto space-y-1">
                {notInCatalog.slice(0, 20).map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                    <div>
                      <p className="text-sm text-brand-charcoal">{p.name}</p>
                      <p className="text-xs text-gray-400">{formatPrice(p.retail_price)}</p>
                    </div>
                    {addingProduct === p.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Custom $"
                          value={customPriceInput}
                          onChange={(e) => setCustomPriceInput(e.target.value)}
                          className="w-24 text-xs"
                        />
                        <button onClick={() => addToCatalog(p.id)} className="text-brand-green"><Check className="h-4 w-4" /></button>
                        <button onClick={() => setAddingProduct(null)} className="text-gray-400"><X className="h-4 w-4" /></button>
                      </div>
                    ) : (
                      <button onClick={() => { setAddingProduct(p.id); setCustomPriceInput('') }} className="text-brand-green">
                        <Plus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Schedule ── */}
      {tab === 'schedule' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-brand-charcoal">Delivery Schedules</h2>
              <Button size="sm" onClick={() => setShowScheduleForm((v) => !v)} className="gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Schedule
              </Button>
            </div>

            {showScheduleForm && (
              <form onSubmit={addSchedule} className="bg-gray-50 rounded-xl p-4 space-y-3 mb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Frequency</label>
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={scheduleForm.frequency} onChange={(e) => setScheduleForm({ ...scheduleForm, frequency: e.target.value as 'weekly' | 'biweekly' | 'monthly' })}>
                      {Object.entries(FREQ_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Day of Week</label>
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={scheduleForm.day_of_week} onChange={(e) => setScheduleForm({ ...scheduleForm, day_of_week: Number(e.target.value) })}>
                      {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Time Window</label>
                    <Input value={scheduleForm.time_window} onChange={(e) => setScheduleForm({ ...scheduleForm, time_window: e.target.value })} placeholder="e.g. 9am-12pm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                    <Input value={scheduleForm.notes} onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })} placeholder="Gate code, dock #…" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={saving}>Save Schedule</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setShowScheduleForm(false)}>Cancel</Button>
                </div>
              </form>
            )}

            {scheduleList.length === 0 ? (
              <p className="text-gray-400 text-sm">No delivery schedules yet.</p>
            ) : (
              <div className="space-y-3">
                {scheduleList.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-brand-charcoal">
                        {FREQ_LABELS[s.frequency]} · {s.day_of_week !== null ? DAYS[s.day_of_week] : '—'}
                        {s.time_window && ` · ${s.time_window}`}
                      </p>
                      {s.notes && <p className="text-xs text-gray-400 mt-0.5">{s.notes}</p>}
                      {s.next_delivery_at && (
                        <p className="text-xs text-brand-green mt-0.5">Next: {new Date(s.next_delivery_at).toLocaleDateString()}</p>
                      )}
                    </div>
                    <button onClick={() => deleteSchedule(s.id)}><Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Members ── */}
      {tab === 'members' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-brand-charcoal mb-4 flex items-center gap-2"><Users className="h-4 w-4" /> Team Members</h2>

            <form onSubmit={inviteMember} className="bg-gray-50 rounded-xl p-4 space-y-3 mb-6">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> Invite Member</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input type="email" placeholder="email@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
                <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as B2BMemberRole)}>
                  <option value="owner">Owner (full access)</option>
                  <option value="approver">Approver (approve orders)</option>
                  <option value="member">Member (place orders)</option>
                </select>
                <Input type="number" step="0.01" placeholder="Spend limit $ (optional)" value={inviteSpendLimit} onChange={(e) => setInviteSpendLimit(e.target.value)} />
              </div>
              <Button type="submit" size="sm" disabled={saving || !inviteEmail} className="gap-1">
                <Mail className="h-3.5 w-3.5" /> Send Invite
              </Button>
            </form>

            {memberList.length === 0 ? (
              <p className="text-gray-400 text-sm">No members yet.</p>
            ) : (
              <div className="space-y-2">
                {memberList.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-brand-charcoal">{m.email}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        <span className="capitalize font-medium">{m.role}</span>
                        {m.spend_limit && ` · Limit: ${formatPrice(m.spend_limit)}/order`}
                        {!m.accepted_at && <span className="ml-2 text-amber-600">Invite pending</span>}
                      </p>
                    </div>
                    {m.role !== 'owner' && (
                      <button onClick={() => removeMember(m.id)}><Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" /></button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
