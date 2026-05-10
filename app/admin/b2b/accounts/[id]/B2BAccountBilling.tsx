'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Receipt, Truck, ExternalLink, RefreshCw, AlertTriangle, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils/format'
import type { BusinessAccount, BusinessInvoice, Order } from '@/types'

type RecentOrder = Pick<Order, 'id' | 'order_number' | 'status' | 'total' | 'created_at'>

interface Props {
  account: BusinessAccount
  invoices: BusinessInvoice[]
  recentOrders: RecentOrder[]
}

export function B2BAccountBilling({ account, invoices, recentOrders }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function triggerOrder() {
    setBusy('trigger')
    setMessage(null)
    const res = await fetch(`/api/admin/b2b/accounts/${account.id}/trigger-order`, { method: 'POST' })
    const data = await res.json()
    setMessage(
      data.status === 'created'
        ? `Order ${data.order_number} created.`
        : `Skipped: ${data.reason ?? 'unknown'}`
    )
    setBusy(null)
    router.refresh()
  }

  async function setStatus(status: 'active' | 'suspended' | 'canceled') {
    setBusy(status)
    setMessage(null)
    const res = await fetch(`/api/admin/b2b/accounts/${account.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) setMessage(`Account ${status}.`)
    else setMessage('Failed to update status.')
    setBusy(null)
    router.refresh()
  }

  const isSuspended = account.status === 'suspended'
  const isCanceled = account.status === 'canceled'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-brand-charcoal mb-4 flex items-center gap-2">
          <Truck className="h-4 w-4" /> Operations
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={triggerOrder} disabled={busy !== null || isCanceled} className="gap-1">
            {busy === 'trigger' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Generate Order Now
          </Button>
          {!isSuspended ? (
            <Button size="sm" variant="outline" onClick={() => setStatus('suspended')} disabled={busy !== null || isCanceled} className="gap-1">
              <AlertTriangle className="h-4 w-4" /> Suspend
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setStatus('active')} disabled={busy !== null} className="gap-1">
              <RefreshCw className="h-4 w-4" /> Reactivate
            </Button>
          )}
        </div>
        {message && <p className="mt-3 text-xs text-gray-500">{message}</p>}

        <div className="mt-6">
          <h3 className="text-xs uppercase tracking-wide text-gray-400 mb-2">Recent Generated Orders</h3>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-400">No orders generated yet.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {recentOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <Link href={`/admin/orders/${o.id}`} className="font-medium text-brand-charcoal hover:text-brand-green">
                      {o.order_number}
                    </Link>
                    <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(o.total)}</p>
                    <p className="text-xs text-gray-400 capitalize">{o.status}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-brand-charcoal mb-4 flex items-center gap-2">
          <Receipt className="h-4 w-4" /> Invoices ({invoices.length})
        </h2>
        {invoices.length === 0 ? (
          <p className="text-sm text-gray-400">No invoices yet.</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium text-brand-charcoal">{formatPrice(inv.amount_due)}</p>
                  <p className="text-xs text-gray-400">{new Date(inv.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                    inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                    inv.status === 'open' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {inv.status}
                  </span>
                  {inv.invoice_pdf_url && (
                    <a
                      href={inv.invoice_pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-green hover:text-green-700"
                      aria-label="View invoice PDF"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {account.dunning_stage > 0 && (
          <p className="mt-4 text-xs text-amber-600 flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" /> Dunning stage {account.dunning_stage}/3
          </p>
        )}
      </div>
    </div>
  )
}
