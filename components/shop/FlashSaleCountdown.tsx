'use client'

import { useEffect, useState } from 'react'
import { Zap } from 'lucide-react'

interface Props {
  endsAt: string
  badgeLabel?: string
  className?: string
}

function getTimeLeft(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now()
  if (diff <= 0) return null
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return { h, m, s, diff }
}

function pad(n: number) { return String(n).padStart(2, '0') }

export function FlashSaleCountdown({ endsAt, badgeLabel = 'FLASH SALE', className = '' }: Props) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(endsAt))

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft(endsAt)), 1000)
    return () => clearInterval(id)
  }, [endsAt])

  if (!timeLeft) return null

  const { h, m, s } = timeLeft
  const urgent = timeLeft.diff < 3600000  // < 1 hour

  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold ${urgent ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'} ${className}`}>
      <Zap className="h-3.5 w-3.5 shrink-0" />
      <span>{badgeLabel}</span>
      <span className="tabular-nums ml-1">
        {h > 0 && `${pad(h)}:`}{pad(m)}:{pad(s)}
      </span>
    </div>
  )
}
