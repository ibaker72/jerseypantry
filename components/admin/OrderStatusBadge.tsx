import { Badge } from '@/components/ui/badge'
import type { OrderStatus } from '@/types'

const statusConfig: Record<OrderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'orange' | 'navy' }> = {
  pending: { label: 'Pending', variant: 'secondary' },
  paid: { label: 'Paid', variant: 'navy' },
  preparing: { label: 'Preparing', variant: 'orange' },
  out_for_delivery: { label: 'Out for Delivery', variant: 'orange' },
  completed: { label: 'Completed', variant: 'default' },
  canceled: { label: 'Canceled', variant: 'destructive' },
  refunded: { label: 'Refunded', variant: 'outline' },
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status] ?? { label: status, variant: 'outline' as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
