'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import {
  updateStockRequestStatus,
  updateStockRequestNotes,
} from '@/lib/actions/stock-requests'
import type { StockRequest, StockRequestStatus } from '@/types'

const STATUS_OPTIONS: { value: StockRequestStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'sourced', label: 'Sourced' },
  { value: 'declined', label: 'Declined' },
]

const STATUS_COLORS: Record<StockRequestStatus, string> = {
  new: 'bg-orange-100 text-orange-700',
  reviewing: 'bg-blue-100 text-blue-700',
  sourced: 'bg-green-100 text-green-700',
  declined: 'bg-gray-100 text-gray-600',
}

export function StockRequestRow({ request }: { request: StockRequest }) {
  const [status, setStatus] = useState<StockRequestStatus>(request.status)
  const [notes, setNotes] = useState(request.admin_notes ?? '')
  const [savedNotes, setSavedNotes] = useState(request.admin_notes ?? '')
  const [pending, startTransition] = useTransition()
  const [savingNotes, setSavingNotes] = useState(false)

  const handleStatusChange = (next: StockRequestStatus) => {
    const prev = status
    setStatus(next)
    startTransition(async () => {
      const res = await updateStockRequestStatus(request.id, next)
      if (!res.ok) setStatus(prev)
    })
  }

  const handleNotesSave = async () => {
    if (notes === savedNotes) return
    setSavingNotes(true)
    const res = await updateStockRequestNotes(request.id, notes)
    setSavingNotes(false)
    if (res.ok) setSavedNotes(notes)
  }

  return (
    <tr className="align-top">
      <td className="px-4 py-3">
        <p className="font-medium text-brand-charcoal">{request.product_name}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {[request.brand, request.size].filter(Boolean).join(' · ') || '—'}
        </p>
        {request.notes && (
          <p className="text-xs text-gray-500 mt-1 italic">
            &ldquo;{request.notes}&rdquo;
          </p>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <span className="inline-flex items-center justify-center min-w-[2rem] h-7 rounded-full bg-brand-orange/10 text-brand-orange text-sm font-bold px-2">
          {request.request_count}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {request.email && <p>{request.email}</p>}
        {request.phone && <p>{request.phone}</p>}
        {!request.email && !request.phone && <span>—</span>}
      </td>
      <td className="px-4 py-3 text-sm text-gray-400">{request.source}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium rounded-full px-2 py-0.5 ${STATUS_COLORS[status]}`}
          >
            {status}
          </span>
          <select
            value={status}
            onChange={(e) =>
              handleStatusChange(e.target.value as StockRequestStatus)
            }
            disabled={pending}
            className="text-xs border border-gray-200 rounded-md px-1.5 py-1 bg-white"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />}
        </div>
      </td>
      <td className="px-4 py-3">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotesSave}
          rows={2}
          placeholder="Add note…"
          className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-green"
        />
        {savingNotes && (
          <p className="text-[10px] text-gray-400 mt-0.5">Saving…</p>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
        {new Date(request.created_at).toLocaleDateString()}
      </td>
    </tr>
  )
}
