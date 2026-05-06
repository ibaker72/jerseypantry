import { cn } from '@/lib/utils/cn'

interface AdminStatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  color?: 'green' | 'orange' | 'blue' | 'red'
}

const colorMap = {
  green: 'bg-green-50 text-green-700',
  orange: 'bg-orange-50 text-orange-700',
  blue: 'bg-blue-50 text-blue-700',
  red: 'bg-red-50 text-red-700',
}

export function AdminStatCard({ title, value, subtitle, icon, color = 'green' }: AdminStatCardProps) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-brand-charcoal mt-0.5">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {icon && (
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colorMap[color])}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
