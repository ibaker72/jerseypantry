import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Building2, CreditCard, Calendar, Receipt, ExternalLink } from 'lucide-react'
import type { BusinessAccount, BusinessInvoice, DeliverySchedule, B2BPlan } from '@/types'
import { ManageBillingButton } from './ManageBillingButton'

export const metadata = { title: 'Business Account — My Corner Store' }

const PLAN_LABELS: Record<B2BPlan, string> = {
  starter: 'Starter ($99/mo)',
  standard: 'Standard ($199/mo)',
  premium: 'Premium ($399/mo)',
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  past_due: 'bg-red-100 text-red-600',
  canceled: 'bg-gray-100 text-gray-500',
  suspended: 'bg-red-100 text-red-600',
  pending: 'bg-yellow-100 text-yellow-700',
  trialing: 'bg-blue-100 text-blue-700',
  paused: 'bg-orange-100 text-orange-700',
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface MemberRow {
  business_id: string
  business_accounts: BusinessAccount | null
}

export default async function BusinessAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>
}) {
  const { welcome } = await searchParams
  const serverClient = await createClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) redirect('/login?next=/account/business')

  const supabase = createAdminClient()

  const { data: memberRow } = await supabase
    .from('business_members')
    .select('business_id, business_accounts(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single<MemberRow>()

  const account = memberRow?.business_accounts ?? null

  if (!account) {
    return (
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-8 text-center">
        <Building2 className="h-10 w-10 text-gray-200 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-brand-charcoal mb-2">No business account yet</h2>
        <p className="text-gray-500 text-sm mb-6">
          Set up an Office Refill subscription for your team — weekly delivery of snacks, drinks, and supplies.
        </p>
        <Link
          href="/office-refill"
          className="inline-flex items-center gap-2 bg-brand-green text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700"
        >
          Browse Plans →
        </Link>
      </div>
    )
  }

  const [{ data: invoices }, { data: schedules }] = await Promise.all([
    supabase
      .from('business_invoices')
      .select('*')
      .eq('business_id', account.id)
      .order('created_at', { ascending: false })
      .limit(12),
    supabase
      .from('delivery_schedules')
      .select('*')
      .eq('business_id', account.id)
      .eq('is_active', true)
      .order('created_at'),
  ])

  const invoiceList = (invoices ?? []) as BusinessInvoice[]
  const scheduleList = (schedules ?? []) as DeliverySchedule[]
  const nextDelivery = scheduleList
    .map((s) => (s.next_delivery_at ? new Date(s.next_delivery_at) : null))
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime())[0]

  return (
    <div className="space-y-6">
      {welcome && (
        <div className="rounded-2xl bg-green-50 border border-green-200 px-5 py-4 text-sm text-green-800">
          🎉 You&apos;re all set, {account.business_name}! We&apos;ll be in touch to confirm your first delivery.
        </div>
      )}

      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-brand-charcoal flex items-center gap-2">
              <Building2 className="h-4 w-4" /> {account.business_name}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{PLAN_LABELS[account.plan_name]}</p>
          </div>
          <span className={`text-xs font-medium rounded-full px-2.5 py-1 capitalize ${STATUS_BADGE[account.subscription_status] ?? 'bg-gray-100 text-gray-500'}`}>
            {account.subscription_status.replace('_', ' ')}
          </span>
        </div>

        <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-gray-400 text-xs uppercase tracking-wide">Billing</dt>
            <dd className="text-brand-charcoal font-medium capitalize">{account.billing_type === 'net30' ? 'Net-30 Invoice' : 'Credit Card'}</dd>
          </div>
          <div>
            <dt className="text-gray-400 text-xs uppercase tracking-wide">Next Renewal</dt>
            <dd className="text-brand-charcoal font-medium">
              {account.current_period_end ? new Date(account.current_period_end).toLocaleDateString() : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-400 text-xs uppercase tracking-wide flex items-center gap-1"><Calendar className="h-3 w-3" /> Next Delivery</dt>
            <dd className="text-brand-charcoal font-medium">
              {nextDelivery ? nextDelivery.toLocaleDateString() : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-400 text-xs uppercase tracking-wide">Account Status</dt>
            <dd className={`font-medium capitalize ${account.status === 'suspended' ? 'text-red-600' : 'text-brand-charcoal'}`}>
              {account.status}
            </dd>
          </div>
        </dl>

        {account.billing_type === 'card' && account.stripe_customer_id && (
          <div className="mt-6 flex flex-wrap gap-2">
            <ManageBillingButton />
          </div>
        )}
        {account.billing_type === 'net30' && (
          <p className="mt-6 text-xs text-gray-500">
            Net-30 invoicing — invoices are emailed monthly with 30-day terms.
          </p>
        )}
      </div>

      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-brand-charcoal mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4" /> Delivery Schedule
        </h3>
        {scheduleList.length === 0 ? (
          <p className="text-sm text-gray-400">No delivery schedule set yet — your account manager will confirm a day shortly.</p>
        ) : (
          <ul className="space-y-2">
            {scheduleList.map((s) => (
              <li key={s.id} className="text-sm text-brand-charcoal">
                <span className="capitalize">{s.frequency}</span>
                {s.day_of_week !== null && ` · ${DAYS[s.day_of_week]}`}
                {s.time_window && ` · ${s.time_window}`}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-brand-charcoal flex items-center gap-2">
            <Receipt className="h-4 w-4" /> Recent Invoices
          </h3>
          <span className="text-xs text-gray-400">{invoiceList.length}</span>
        </div>
        {invoiceList.length === 0 ? (
          <p className="text-sm text-gray-400 px-6 py-8 text-center">No invoices yet.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50">
              {invoiceList.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50/60">
                  <td className="px-6 py-3">
                    <p className="font-medium text-brand-charcoal">${inv.amount_due.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">{new Date(inv.created_at).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                      inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                      inv.status === 'open' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    {inv.invoice_pdf_url && (
                      <a
                        href={inv.invoice_pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-brand-green hover:underline"
                      >
                        PDF <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-gray-400">
        <CreditCard className="inline h-3 w-3 mr-1" />
        Need to change your plan, billing card, or delivery day? Contact your account manager or use the Manage Billing button.
      </p>
    </div>
  )
}
