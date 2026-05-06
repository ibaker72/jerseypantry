import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { Building2, Plus, ExternalLink } from 'lucide-react'
import type { BusinessAccount, OfficeRefillLead } from '@/types'

export const metadata = { title: 'B2B Accounts — Admin' }

const STATUS_BADGE: Record<string, string> = {
  active:    'bg-green-100 text-green-700',
  past_due:  'bg-red-100 text-red-600',
  canceled:  'bg-gray-100 text-gray-500',
  pending:   'bg-yellow-100 text-yellow-700',
  trialing:  'bg-blue-100 text-blue-700',
  paused:    'bg-orange-100 text-orange-700',
  suspended: 'bg-red-100 text-red-600',
}

const PLAN_COLORS: Record<string, string> = {
  starter:  'bg-blue-50 text-blue-700',
  standard: 'bg-purple-50 text-purple-700',
  premium:  'bg-amber-50 text-amber-700',
}

export default async function B2BAccountsPage() {
  const supabase = createAdminClient()

  const [{ data: accounts }, { data: leads }] = await Promise.all([
    supabase
      .from('business_accounts')
      .select('*, members:business_members(id)')
      .neq('status', 'canceled')
      .order('created_at', { ascending: false }),
    supabase
      .from('office_refill_leads')
      .select('*')
      .eq('status', 'new')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const bas = (accounts ?? []) as (BusinessAccount & { members: { id: string }[] })[]
  const newLeads = (leads ?? []) as OfficeRefillLead[]

  const activeCount = bas.filter((b) => b.subscription_status === 'active').length
  const mrr = bas
    .filter((b) => b.subscription_status === 'active')
    .reduce((s, b) => s + { starter: 99, standard: 199, premium: 399 }[b.plan_name], 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-charcoal flex items-center gap-2">
            <Building2 className="h-6 w-6 text-brand-green" /> B2B Accounts
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage business subscriptions, catalogs, and delivery schedules</p>
        </div>
        <Link
          href="/office-refill"
          target="_blank"
          className="flex items-center gap-2 text-sm text-brand-green border border-brand-green/30 rounded-xl px-4 py-2 hover:bg-brand-green/5 transition-colors"
        >
          <ExternalLink className="h-4 w-4" /> View Sign-up Page
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Accounts', value: activeCount },
          { label: 'New Leads', value: newLeads.length },
          { label: 'Est. MRR', value: `$${mrr.toLocaleString()}` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-brand-charcoal">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Unworked leads */}
      {newLeads.length > 0 && (
        <div className="bg-amber-50 rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-200 flex items-center justify-between">
            <h2 className="font-semibold text-amber-800">New Leads — Convert to Accounts</h2>
            <Link href="/admin/office-refill-leads" className="text-xs text-amber-700 hover:underline">View all leads →</Link>
          </div>
          <div className="divide-y divide-amber-100">
            {newLeads.map((lead) => (
              <div key={lead.id} className="px-6 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-amber-900 text-sm">{lead.business_name}</p>
                  <p className="text-xs text-amber-700">{lead.email} · {lead.business_type ?? '—'} · {lead.estimated_budget?.replace('_', '-$') ?? '—'}</p>
                </div>
                <Link
                  href={`/admin/b2b/accounts/new?lead_id=${lead.id}&email=${encodeURIComponent(lead.email)}&name=${encodeURIComponent(lead.business_name)}&type=${encodeURIComponent(lead.business_type ?? '')}&contact=${encodeURIComponent(lead.contact_name ?? '')}`}
                  className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Convert
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accounts table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-brand-charcoal">All Accounts ({bas.length})</h2>
          <Link
            href="/admin/b2b/accounts/new"
            className="bg-brand-green text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-green-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> New Account
          </Link>
        </div>
        {bas.length === 0 ? (
          <p className="text-gray-400 text-sm p-6 text-center">No accounts yet. Convert a lead or create one manually.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50 text-xs text-gray-500 uppercase">
                <th className="text-left px-6 py-3">Business</th>
                <th className="text-left px-6 py-3">Plan</th>
                <th className="text-left px-6 py-3">Billing</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-right px-6 py-3">Members</th>
                <th className="text-left px-6 py-3">Renews</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bas.map((ba) => (
                <tr key={ba.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-3">
                    <p className="font-medium text-brand-charcoal">{ba.business_name}</p>
                    <p className="text-xs text-gray-400">{ba.contact_email}</p>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${PLAN_COLORS[ba.plan_name]}`}>
                      {ba.plan_name}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-500 text-xs capitalize">{ba.billing_type}</td>
                  <td className="px-6 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[ba.subscription_status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {ba.subscription_status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right text-gray-600">{ba.members?.length ?? 0}</td>
                  <td className="px-6 py-3 text-gray-400 text-xs">
                    {ba.current_period_end ? new Date(ba.current_period_end).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-3">
                    <Link
                      href={`/admin/b2b/accounts/${ba.id}`}
                      className="text-xs text-brand-green hover:underline font-medium"
                    >
                      Manage →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
