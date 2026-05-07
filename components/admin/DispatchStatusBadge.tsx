import type { DispatchStatus } from '@/types/wholesale'

const CONFIG: Record<DispatchStatus, { label: string; className: string }> = {
  pending_pickup:           { label: 'Pending Pickup',          className: 'bg-gray-100 text-gray-600' },
  picked_up_from_wholesaler:{ label: 'Picked Up',               className: 'bg-blue-100 text-blue-700' },
  out_for_delivery:         { label: 'Out for Delivery',         className: 'bg-amber-100 text-amber-700' },
  delivered:                { label: 'Delivered',                className: 'bg-emerald-100 text-emerald-700' },
  driver_assigned:          { label: 'Driver Assigned',          className: 'bg-purple-100 text-purple-700' },
  at_wholesaler:            { label: 'At Wholesaler',            className: 'bg-indigo-100 text-indigo-700' },
  courier_dispatched:       { label: 'Courier Dispatched',       className: 'bg-sky-100 text-sky-700' },
}

export function DispatchStatusBadge({ status }: { status: DispatchStatus }) {
  const cfg = CONFIG[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}
