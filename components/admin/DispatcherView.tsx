'use client'

import { useState, useTransition } from 'react'
import { Truck, Package, CheckCircle2, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'
import { updateDispatchStatus, requestCourierQuote, attachCourierQuote } from '@/lib/actions/dispatch'
import { DispatchStatusBadge } from './DispatchStatusBadge'
import type { DispatchOrder, DispatchStatus } from '@/types/wholesale'

// ── Self-Delivery Workflow ────────────────────────────────────────────────────

const SELF_DELIVERY_STEPS: { status: DispatchStatus; label: string; icon: React.ElementType }[] = [
  { status: 'picked_up_from_wholesaler', label: 'Mark as Picked Up from Wholesaler', icon: Package },
  { status: 'out_for_delivery',          label: 'Mark as Out for Delivery',           icon: Truck },
  { status: 'delivered',                 label: 'Mark as Delivered',                  icon: CheckCircle2 },
]

const SELF_DELIVERY_ORDER: DispatchStatus[] = [
  'pending_pickup',
  'picked_up_from_wholesaler',
  'out_for_delivery',
  'delivered',
]

function SelfDeliveryControls({
  dispatch,
  onUpdate,
}: {
  dispatch: DispatchOrder
  onUpdate: (id: string, status: DispatchStatus) => void
}) {
  const [pending, startTransition] = useTransition()
  const [err, setErr] = useState<string | null>(null)

  const currentIndex = SELF_DELIVERY_ORDER.indexOf(dispatch.status)
  const nextStep = SELF_DELIVERY_STEPS.find(
    (s) => SELF_DELIVERY_ORDER.indexOf(s.status) === currentIndex + 1
  )

  if (!nextStep || dispatch.status === 'delivered') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
        <CheckCircle2 className="w-4 h-4" /> Delivery complete
      </div>
    )
  }

  const handleAdvance = () => {
    setErr(null)
    startTransition(async () => {
      const result = await updateDispatchStatus(dispatch.id, nextStep.status)
      if (!result.success) { setErr(result.error ?? 'Update failed'); return }
      onUpdate(dispatch.id, nextStep.status)
    })
  }

  const Icon = nextStep.icon

  return (
    <div>
      <button
        onClick={handleAdvance}
        disabled={pending}
        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-brand-green text-white px-3 py-1.5 rounded-lg hover:bg-green-800 transition-colors disabled:opacity-60"
      >
        <Icon className="w-3.5 h-3.5" />
        {pending ? 'Updating…' : nextStep.label}
      </button>
      {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
    </div>
  )
}

// ── Courier Workflow ──────────────────────────────────────────────────────────

const COURIER_STEPS: { status: DispatchStatus; label: string }[] = [
  { status: 'driver_assigned',     label: 'Driver Assigned' },
  { status: 'at_wholesaler',       label: 'At Wholesaler' },
  { status: 'courier_dispatched',  label: 'Out for Delivery' },
  { status: 'delivered',           label: 'Delivered' },
]

function CourierControls({
  dispatch,
  onUpdate,
}: {
  dispatch: DispatchOrder
  onUpdate: (id: string, status: DispatchStatus) => void
}) {
  const [pending, startTransition] = useTransition()
  const [quoting, setQuoting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const handleRequestQuote = async () => {
    setQuoting(true)
    setErr(null)
    try {
      const quote = await requestCourierQuote({
        order_id: dispatch.order_id,
        pickup_address: 'Local Wholesaler, North Jersey',
        dropoff_address: dispatch.orders?.delivery_address
          ? Object.values(dispatch.orders.delivery_address).join(', ')
          : 'Customer address',
        total_weight_lbs: dispatch.total_weight_lbs,
      })
      const result = await attachCourierQuote(dispatch.id, quote)
      if (!result.success) throw new Error(result.error)
      onUpdate(dispatch.id, 'pending_pickup')
    } catch (e) {
      setErr(String(e))
    } finally {
      setQuoting(false)
    }
  }

  // Show quote button if no quote assigned yet
  if (!dispatch.courier_quote_id && dispatch.status === 'pending_pickup') {
    return (
      <div>
        <button
          onClick={handleRequestQuote}
          disabled={quoting}
          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-sky-600 text-white px-3 py-1.5 rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-60"
        >
          <Truck className="w-3.5 h-3.5" />
          {quoting ? 'Getting Quote…' : 'Request Courier Quote'}
        </button>
        {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
      </div>
    )
  }

  // Progress through courier steps
  const currentIdx = COURIER_STEPS.findIndex((s) => s.status === dispatch.status)
  const nextCourierStep = COURIER_STEPS[currentIdx + 1]

  if (!nextCourierStep || dispatch.status === 'delivered') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
        <CheckCircle2 className="w-4 h-4" /> Courier delivery complete
      </div>
    )
  }

  const handleAdvance = () => {
    setErr(null)
    startTransition(async () => {
      const result = await updateDispatchStatus(dispatch.id, nextCourierStep.status)
      if (!result.success) { setErr(result.error ?? 'Update failed'); return }
      onUpdate(dispatch.id, nextCourierStep.status)
    })
  }

  return (
    <div className="space-y-1.5">
      {/* Courier quote info */}
      {dispatch.courier_fee && (
        <p className="text-xs text-gray-500">
          Courier fee: <strong className="text-gray-700">{formatPrice(dispatch.courier_fee)}</strong>
          {dispatch.courier_provider && (
            <span className="ml-1 capitalize text-sky-600">· {dispatch.courier_provider}</span>
          )}
        </p>
      )}

      {/* Progress pills */}
      <div className="flex items-center gap-1 flex-wrap mb-2">
        {COURIER_STEPS.map((s, idx) => (
          <span
            key={s.status}
            className={`text-xs px-2 py-0.5 rounded-full ${
              idx < currentIdx + 1
                ? 'bg-sky-100 text-sky-700 font-medium'
                : idx === currentIdx + 1
                ? 'bg-sky-600 text-white font-semibold'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            {s.label}
          </span>
        ))}
      </div>

      <button
        onClick={handleAdvance}
        disabled={pending}
        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-sky-600 text-white px-3 py-1.5 rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-60"
      >
        {pending ? 'Updating…' : `→ ${nextCourierStep.label}`}
      </button>

      {dispatch.courier_tracking_url && (
        <a
          href={dispatch.courier_tracking_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-sky-600 hover:underline"
        >
          <ExternalLink className="w-3 h-3" /> Track driver
        </a>
      )}
      {err && <p className="text-xs text-red-500">{err}</p>}
    </div>
  )
}

// ── Main Dispatcher View ──────────────────────────────────────────────────────

interface DispatcherViewProps {
  initialDispatches: DispatchOrder[]
}

export function DispatcherView({ initialDispatches }: DispatcherViewProps) {
  const [dispatches, setDispatches] = useState<DispatchOrder[]>(initialDispatches)
  const [filter, setFilter] = useState<'all' | 'self_delivery' | 'courier' | 'pending'>('pending')

  const handleUpdate = (id: string, status: DispatchStatus) => {
    setDispatches((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status } : d))
    )
  }

  const filtered = dispatches.filter((d) => {
    if (filter === 'pending') return d.status !== 'delivered'
    if (filter === 'self_delivery') return d.delivery_type === 'self_delivery'
    if (filter === 'courier') return d.delivery_type === 'courier'
    return true
  })

  const pendingCount = dispatches.filter((d) => d.status !== 'delivered').length

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {([
          ['pending', `Pending (${pendingCount})`],
          ['self_delivery', 'Self-Delivery'],
          ['courier', 'Courier'],
          ['all', 'All'],
        ] as [typeof filter, string][]).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
              filter === val ? 'bg-white text-brand-charcoal shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
          <CheckCircle2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No dispatches here</p>
          <p className="text-sm text-gray-400 mt-1">All caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((dispatch) => (
            <div
              key={dispatch.id}
              className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden"
            >
              <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Left: Order info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-brand-charcoal text-sm">
                      {dispatch.orders?.order_number ?? `Order ${dispatch.order_id.slice(0, 8)}`}
                    </span>
                    <DispatchStatusBadge status={dispatch.status} />
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        dispatch.delivery_type === 'courier'
                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {dispatch.delivery_type === 'courier' ? '🚗 Courier' : '🛻 Self-Delivery'}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mb-1">
                    {dispatch.orders?.email ?? dispatch.customer_email ?? '—'}
                  </p>

                  {dispatch.orders?.delivery_address && (
                    <p className="text-xs text-gray-400">
                      {Object.values(dispatch.orders.delivery_address).filter(Boolean).join(', ')}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>{dispatch.total_weight_lbs} lbs</span>
                    {dispatch.distance_miles && <span>{dispatch.distance_miles} mi</span>}
                    {dispatch.orders?.total && (
                      <span className="font-medium text-gray-600">
                        {formatPrice(dispatch.orders.total)}
                      </span>
                    )}
                    {dispatch.notes && (
                      <span className="italic text-amber-600 flex items-center gap-0.5">
                        <AlertCircle className="w-3 h-3" /> {dispatch.notes}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Workflow controls */}
                <div className="shrink-0">
                  {dispatch.delivery_type === 'self_delivery' ? (
                    <SelfDeliveryControls dispatch={dispatch} onUpdate={handleUpdate} />
                  ) : (
                    <CourierControls dispatch={dispatch} onUpdate={handleUpdate} />
                  )}
                </div>
              </div>

              {/* Timeline footer for courier */}
              {dispatch.delivery_type === 'courier' && dispatch.status !== 'pending_pickup' && (
                <div className="bg-gray-50 border-t border-gray-100 px-5 py-2 flex items-center gap-4 text-xs text-gray-400 overflow-x-auto">
                  {([
                    ['Driver Assigned', dispatch.status === 'driver_assigned' || COURIER_STEPS.findIndex(s => s.status === dispatch.status) > 0],
                    ['At Wholesaler',   COURIER_STEPS.findIndex(s => s.status === dispatch.status) >= 1],
                    ['Out for Delivery',COURIER_STEPS.findIndex(s => s.status === dispatch.status) >= 2],
                    ['Delivered',       dispatch.status === 'delivered'],
                  ] as [string, boolean][]).map(([label, done]) => (
                    <span
                      key={label}
                      className={`flex items-center gap-1 whitespace-nowrap ${done ? 'text-sky-600 font-medium' : ''}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${done ? 'bg-sky-500' : 'bg-gray-300'}`} />
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
