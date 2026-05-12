'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'

type DeliveryStatus =
  | 'created'
  | 'quoted'
  | 'confirmed'
  | 'enroute_to_pickup'
  | 'arrived_at_pickup'
  | 'picked_up'
  | 'enroute_to_dropoff'
  | 'arrived_at_dropoff'
  | 'delivered'
  | 'canceled'
  | 'returned'
  | 'failed'

interface OrderRow {
  id: string
  delivery_status: DeliveryStatus | null
  tracking_url: string | null
  delivery_updated_at: string | null
}

interface DeliveryTrackerProps {
  orderId: string
  initialStatus?: DeliveryStatus | null
  initialTrackingUrl?: string | null
  initialUpdatedAt?: string | null
  className?: string
}

const STEPS: Array<{ status: DeliveryStatus; label: string }> = [
  { status: 'confirmed', label: 'Confirmed' },
  { status: 'enroute_to_pickup', label: 'Driver en route' },
  { status: 'picked_up', label: 'Picked up' },
  { status: 'enroute_to_dropoff', label: 'Out for delivery' },
  { status: 'delivered', label: 'Delivered' },
]

const FAILED_STATES = new Set<DeliveryStatus>(['canceled', 'returned', 'failed'])

function stepIndex(status: DeliveryStatus | null): number {
  if (!status) return 0
  const idx = STEPS.findIndex(s => s.status === status)
  if (idx >= 0) return idx
  // Map intermediate states forward
  if (status === 'arrived_at_pickup') return STEPS.findIndex(s => s.status === 'enroute_to_pickup')
  if (status === 'arrived_at_dropoff') return STEPS.findIndex(s => s.status === 'enroute_to_dropoff')
  if (status === 'created' || status === 'quoted') return 0
  return 0
}

export function DeliveryTracker({
  orderId,
  initialStatus = null,
  initialTrackingUrl = null,
  initialUpdatedAt = null,
  className,
}: DeliveryTrackerProps) {
  const [status, setStatus] = useState<DeliveryStatus | null>(initialStatus)
  const [trackingUrl, setTrackingUrl] = useState<string | null>(initialTrackingUrl)
  const [updatedAt, setUpdatedAt] = useState<string | null>(initialUpdatedAt)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let canceled = false

    // Fetch current state once on mount to avoid stale SSR data
    supabase
      .from('orders')
      .select('id, delivery_status, tracking_url, delivery_updated_at')
      .eq('id', orderId)
      .single()
      .then(({ data }) => {
        if (canceled || !data) return
        const row = data as OrderRow
        setStatus(row.delivery_status)
        setTrackingUrl(row.tracking_url)
        setUpdatedAt(row.delivery_updated_at)
      })

    const channel = supabase
      .channel(`order-delivery-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        payload => {
          const row = payload.new as OrderRow
          setStatus(row.delivery_status)
          setTrackingUrl(row.tracking_url)
          setUpdatedAt(row.delivery_updated_at)
        }
      )
      .subscribe()

    return () => {
      canceled = true
      supabase.removeChannel(channel)
    }
  }, [orderId, supabase])

  const failed = status && FAILED_STATES.has(status)
  const activeIdx = stepIndex(status)
  const progressPct = failed
    ? 100
    : Math.round(((activeIdx + (status === 'delivered' ? 1 : 0.5)) / STEPS.length) * 100)

  return (
    <div
      className={cn(
        'rounded-lg border border-neutral-200 bg-white p-5 font-mono text-sm',
        className
      )}
    >
      <div className="flex items-baseline justify-between">
        <h3 className="text-xs uppercase tracking-widest text-neutral-500">
          Delivery
        </h3>
        <span
          className={cn(
            'text-xs tabular-nums',
            failed ? 'text-red-600' : 'text-neutral-500'
          )}
        >
          {status ? formatStatus(status) : 'awaiting driver'}
        </span>
      </div>

      <div className="mt-4 h-1.5 w-full overflow-hidden rounded bg-neutral-100">
        <div
          className={cn(
            'h-full transition-all duration-500 ease-out',
            failed ? 'bg-red-500' : 'bg-emerald-500'
          )}
          style={{ width: `${Math.max(progressPct, 5)}%` }}
        />
      </div>

      <ol className="mt-4 grid grid-cols-5 gap-1 text-[10px] uppercase tracking-wider">
        {STEPS.map((step, i) => {
          const reached = !failed && i <= activeIdx
          const current = !failed && i === activeIdx
          return (
            <li
              key={step.status}
              className={cn(
                'flex flex-col items-center gap-1',
                reached ? 'text-neutral-900' : 'text-neutral-400',
                current && 'font-semibold'
              )}
            >
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  reached ? 'bg-emerald-500' : 'bg-neutral-300',
                  current && 'ring-2 ring-emerald-200'
                )}
              />
              <span className="text-center leading-tight">{step.label}</span>
            </li>
          )
        })}
      </ol>

      {failed ? (
        <p className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          Delivery {formatStatus(status!)}. We&apos;ll be in touch with next steps.
        </p>
      ) : null}

      <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
        <span className="tabular-nums">
          {updatedAt ? `Updated ${formatRelative(updatedAt)}` : '—'}
        </span>
        {trackingUrl ? (
          <a
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-neutral-900 underline underline-offset-4 hover:text-emerald-700"
          >
            Live map →
          </a>
        ) : null}
      </div>
    </div>
  )
}

function formatStatus(s: DeliveryStatus): string {
  return s.replace(/_/g, ' ')
}

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const sec = Math.round(diffMs / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.round(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  return `${hr}h ago`
}
