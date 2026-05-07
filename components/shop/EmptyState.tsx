import { cn } from '@/lib/utils/cn'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: string
  action?: React.ReactNode
  className?: string
  variant?: 'default' | 'dashed' | 'solid'
}

export function EmptyState({
  title,
  description,
  icon = '🛍️',
  action,
  className,
  variant = 'dashed',
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 text-center px-6 rounded-2xl',
        variant === 'dashed' && 'border-2 border-dashed border-gray-200 bg-gray-50/40',
        variant === 'solid' && 'bg-brand-cream border border-gray-100 shadow-sm',
        className
      )}
    >
      <div className="w-20 h-20 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-4xl mb-5">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-brand-charcoal mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-sm mb-6 leading-relaxed">{description}</p>
      )}
      {action}
    </div>
  )
}
