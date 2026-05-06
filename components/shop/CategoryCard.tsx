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
  'drinks': 'bg-blue-50 border-blue-100 hover:border-blue-300',
  'energy-hydration': 'bg-yellow-50 border-yellow-100 hover:border-yellow-300',
  'chips-salty-snacks': 'bg-orange-50 border-orange-100 hover:border-orange-300',
  'candy-chocolate': 'bg-pink-50 border-pink-100 hover:border-pink-300',
  'cookies-sweets': 'bg-amber-50 border-amber-100 hover:border-amber-300',
  'coffee-tea': 'bg-stone-50 border-stone-100 hover:border-stone-300',
  'middle-eastern-favorites': 'bg-green-50 border-green-100 hover:border-green-300',
  'household-essentials': 'bg-slate-50 border-slate-100 hover:border-slate-300',
  'personal-care': 'bg-purple-50 border-purple-100 hover:border-purple-300',
  'bundles': 'bg-indigo-50 border-indigo-100 hover:border-indigo-300',
  'office-refill': 'bg-teal-50 border-teal-100 hover:border-teal-300',
  'local-delivery-deals': 'bg-red-50 border-red-100 hover:border-red-300',
}

interface CategoryCardProps {
  category: Category
  className?: string
}

export function CategoryCard({ category, className }: CategoryCardProps) {
  const emoji = categoryEmoji[category.slug] ?? '🛍️'
  const color = categoryColor[category.slug] ?? 'bg-gray-50 border-gray-100 hover:border-gray-300'

  return (
    <Link
      href={`/categories/${category.slug}`}
      className={cn(
        'flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all hover:shadow-md hover:-translate-y-0.5',
        color,
        className
      )}
    >
      <span className="text-3xl">{emoji}</span>
      <span className="text-xs font-semibold text-brand-charcoal leading-tight">{category.name}</span>
    </Link>
  )
}
