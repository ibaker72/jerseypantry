import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { formatPrice } from "@/lib/utils/format"
import { B2B_PLANS } from '@/types'
import { B2BBillingPortalButton } from './B2BBillingPortalButton'
import { CreditCard, FileText, ExternalLink } from 'lucide-react'

const INVOICE_STATUS_CLASSES: Record<string, string> = {
  paid: 'bg-green-100 text-green-800',
  open: 'bg-yellow-100 text-yellow-800',
  draft: 'bg-gray-100 text-gray-600',
  void: 'bg-gray-100 text-gray-500',
  uncollectible: 'bg-red-100 text-red-700',
}

export default async function B2BBillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/b2b/billing')

  const admin = createAdminClient()

  const { data: member } = await admin
    .from('business_members')
    .select('business_id, role')
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null)
    .single()

  if (!member) redirect('/office-refill?no_account=1')

  const [{ data: account }, { data: invoices }] = await Promise.all([
    admin.from('business_accounts').select('*').eq('id', member.business_id).single(),
    admin
      .from('business_invoices')
      .select('*')
      .eq('business_id', member.business_id)
      .order('created_at', { ascending: false })
      .limit(24),
  ])

  const plan = account ? B2B_PLANS[account.plan_name as keyof typeof B2B_PLANS] : null
  const isOwner = member.role === 'owner'

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-charcoal">Billing</h1>

      {/* Plan & payment summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Plan</p>
            <p className="font-semibold text-brand-charcoal">{plan?.name ?? account?.plan_name}</p>
            <p className="text-sm text-gray-500">{plan?.priceLabel} / month</p>
          </div>
          {isOwner && (
            <B2BBillingPortalButton />
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Billing type</p>
            <p className="text-sm font-medium text-brand-charcoal capitalize">
              {account?.billing_type === 'net30' ? 'Net-30 Invoice' : 'Credit Card'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Current period ends</p>
            <p className="text-sm font-medium text-brand-charcoal">
              {account?.current_period_end
                ? new Date(account.current_period_end).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric',
                  })
                : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Invoice history */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400" />
          <span className="font-semibold text-brand-charcoal">Invoice History</span>
        </div>
        {!invoices || invoices.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <CreditCard className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No invoices yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-2.5">Date</th>
                <th className="text-left px-5 py-2.5">Status</th>
                <th className="text-right px-5 py-2.5">Amount</th>
                <th className="text-right px-5 py-2.5">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-600">
                    {new Date(inv.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${INVOICE_STATUS_CLASSES[inv.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-medium">
                    {formatPrice(inv.amount_due / 100)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {inv.invoice_pdf_url ? (
                      <a
                        href={inv.invoice_pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-brand-green hover:underline text-xs"
                      >
                        PDF <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
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
