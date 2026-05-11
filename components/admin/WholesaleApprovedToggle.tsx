'use client'

import { useState, useTransition } from 'react'
import { setWholesaleApproved } from '@/lib/actions/b2b-wholesale'

interface Props {
  businessId: string
  initial: boolean
}

export function WholesaleApprovedToggle({ businessId, initial }: Props) {
  const [approved, setApproved] = useState(initial)
  const [pending, startTransition] = useTransition()

  const toggle = () => {
    const next = !approved
    setApproved(next)
    startTransition(async () => {
      const res = await setWholesaleApproved(businessId, next)
      if (!res.success) {
        setApproved(!next)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border transition-colors disabled:opacity-60 ${
        approved
          ? 'bg-amber-400 text-slate-900 border-amber-500 hover:bg-amber-300'
          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
      }`}
      title={approved ? 'Wholesale approved — click to revoke' : 'Not approved — click to enable'}
    >
      {approved ? 'Wholesale ✓' : 'Approve'}
    </button>
  )
}
