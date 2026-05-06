'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import type { OrderStatus } from '@/types'

const ORDER_STATUSES: OrderStatus[] = [
  'pending', 'paid', 'preparing', 'out_for_delivery', 'completed', 'canceled', 'refunded'
]

interface OrderStatusUpdaterProps {
  orderId: string
  currentStatus: OrderStatus
}

export function OrderStatusUpdater({ orderId, currentStatus }: OrderStatusUpdaterProps) {
  const router = useRouter()
  const [status, setStatus] = useState<OrderStatus>(currentStatus)
  const [loading, setLoading] = useState(false)

  const handleUpdate = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('orders').update({ status }).eq('id', orderId)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
      <h2 className="font-semibold text-brand-charcoal mb-4">Update Order Status</h2>
      <div className="flex gap-3">
        <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus)}>
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleUpdate} disabled={loading || status === currentStatus}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><RefreshCw className="h-4 w-4" /> Update</>}
        </Button>
      </div>
    </div>
  )
}
