import Link from 'next/link'
import type { Category } from '@/types'
import { cn } from '@/lib/utils/cn'

const categoryEmoji: Record<string, string> = {
  'drinks': '🥤',
  'energy-hydration': '⚡',
  'chips-salty-snacks': '🍟',
  'candy-chocolate': '🍫',
  'cookies-sweets': '🍪',
  'coffee-tea': '☕',
  'middle-eastern-favorites': '🌿',
  'household-essentials': '🏠',
  'personal-care': '🧴',
  'bundles': '📦',
  'office-refill': '💼',
  'local-delivery-deals': '🚚',
}

const categoryColor: Record<string, string> = {
  'drinks': 'bg-blue-50 border-blue-100 hover:border-blue-300 hover:bg-blue-100/60',
  'energy-hydration': 'bg-yellow-50 border-yellow-100 hover:border-yellow-300 hover:bg-yellow-100/60',
  'chips-salty-snacks': 'bg-orange-50 border-orange-100 hover:border-orange-300 hover:bg-orange-100/60',
  'candy-chocolate': 'bg-pink-50 border-pink-100 hover:border-pink-300 hover:bg-pink-100/60',
  'cookies-sweets': 'bg-amber-50 border-amber-100 hover:border-amber-300 hover:bg-amber-100/60',
  'coffee-tea': 'bg-stone-50 border-stone-100 hover:border-stone-300 hover:bg-stone-100/60',
  'middle-eastern-favorites': 'bg-emerald-50 border-emerald-100 hover:border-emerald-300 hover:bg-emerald-100/60',
  'household-essentials': 'bg-slate-50 border-slate-100 hover:border-slate-300 hover:bg-slate-100/60',
  'personal-care': 'bg-purple-50 border-purple-100 hover:border-purple-300 hover:bg-purple-100/60',
  'bundles': 'bg-indigo-50 border-indigo-100 hover:border-indigo-300 hover:bg-indigo-100/60',
  'office-refill': 'bg-teal-50 border-teal-100 hover:border-teal-300 hover:bg-teal-100/60',
  'local-delivery-deals': 'bg-red-50 border-red-100 hover:border-red-300 hover:bg-red-100/60',
}

interface CategoryCardProps {
  category: Category
  className?: string
}

export function CategoryCard({ category, className }: CategoryCardProps) {
  const emoji = categoryEmoji[category.slug] ?? '🛍️'
  const color = categoryColor[category.slug] ?? 'bg-gray-50 border-gray-100 hover:border-gray-300 hover:bg-gray-100/60'

  return (
    <Link
      href={`/categories/${category.slug}`}
      className={cn(
        'group flex flex-col items-center gap-2.5 rounded-2xl border-2 p-4 sm:p-5 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
        color,
        className
      )}
    >
      <span className="text-3xl sm:text-4xl transition-transform duration-200 group-hover:scale-110">
        {emoji}
      </span>
      <div>
        <span className="text-xs sm:text-sm font-semibold text-brand-charcoal leading-tight block">
          {category.name}
        </span>
        {category.description && (
          <span className="text-[10px] text-gray-400 leading-tight mt-0.5 hidden sm:block line-clamp-1">
            {category.description}
          </span>
        )}
      </div>
    </Link>
  )
}
