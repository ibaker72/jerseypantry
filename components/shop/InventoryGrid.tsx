import { ProductCell } from './ProductCell'
import type { Product } from '@/types'

interface InventoryGridProps {
  products: Product[]
  title?: string
}

export function InventoryGrid({ products, title }: InventoryGridProps) {
  if (products.length === 0) {
    return (
      <div className="border-2 border-dashed border-gray-200 bg-white py-20 text-center">
        <p className="text-2xl mb-3">📦</p>
        <p className="text-sm font-semibold text-gray-500">No products found</p>
        <p className="text-xs text-gray-400 mt-1">
          Try adjusting your filters or search query
        </p>
      </div>
    )
  }

  return (
    <section>
      {title && (
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {title}
          </h2>
          <span className="text-xs text-gray-400">{products.length} items</span>
        </div>
      )}
      {/* 2 cols mobile → 4 cols tablet → 6 cols desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {products.map((product) => (
          <ProductCell key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
