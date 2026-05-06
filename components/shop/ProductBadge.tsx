import { Badge } from '@/components/ui/badge'

const badgeConfig: Record<string, { label: string; variant: 'default' | 'orange' | 'navy' | 'cream' }> = {
  'Best Seller': { label: 'Best Seller', variant: 'orange' },
  'New': { label: 'New', variant: 'navy' },
  'Local Favorite': { label: 'Local Fave', variant: 'default' },
  'Bundle': { label: 'Bundle', variant: 'navy' },
  'Delivery Eligible': { label: 'Local Delivery', variant: 'cream' },
  'Shipping Eligible': { label: 'Ships Free', variant: 'cream' },
  'Middle Eastern': { label: 'Middle Eastern', variant: 'default' },
  'Office Refill': { label: 'Office Refill', variant: 'navy' },
}

interface ProductBadgeProps {
  badge: string
  className?: string
}

export function ProductBadge({ badge, className }: ProductBadgeProps) {
  const config = badgeConfig[badge]
  if (!config) return null
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}

interface ProductBadgeListProps {
  badges: string[]
  max?: number
}

export function ProductBadgeList({ badges, max = 3 }: ProductBadgeListProps) {
  const shown = badges.slice(0, max)
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((b) => (
        <ProductBadge key={b} badge={b} />
      ))}
    </div>
  )
}
