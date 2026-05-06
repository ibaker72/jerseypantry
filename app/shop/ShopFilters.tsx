'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Category } from '@/types'
import { Search } from 'lucide-react'
import { useCallback, useTransition } from 'react'

interface ShopFiltersProps {
  categories: Category[]
}

export function ShopFilters({ categories }: ShopFiltersProps) {
  const router = useRouter()
  const sp = useSearchParams()
  const [, startTransition] = useTransition()

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(sp.toString())
      if (value && value !== 'all' && value !== 'featured') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      startTransition(() => router.push(`/shop?${params.toString()}`))
    },
    [router, sp]
  )

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search products…"
          defaultValue={sp.get('q') ?? ''}
          className="pl-9"
          onChange={(e) => update('q', e.target.value)}
        />
      </div>

      <Select defaultValue={sp.get('category') ?? 'all'} onValueChange={(v) => update('category', v)}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select defaultValue={sp.get('sort') ?? 'featured'} onValueChange={(v) => update('sort', v)}>
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="featured">Featured</SelectItem>
          <SelectItem value="price_asc">Price: Low to High</SelectItem>
          <SelectItem value="price_desc">Price: High to Low</SelectItem>
          <SelectItem value="newest">Newest</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
