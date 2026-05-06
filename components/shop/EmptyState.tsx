import { cn } from '@/lib/utils/cn'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, icon = '🛍️', action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center px-4', className)}>
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-brand-charcoal mb-2">{title}</h3>
      {description && <p className="text-sm text-gray-500 max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  )
}
