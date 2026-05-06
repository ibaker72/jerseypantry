import Link from 'next/link'
import { Plus, Edit, Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils/format'
import type { Product } from '@/types'

export const metadata = { title: 'Products — Admin' }

export default async function AdminProductsPage() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('*, category:categories(name)')
    .order('name')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-charcoal">Products</h1>
        <Button asChild>
          <Link href="/admin/products/new"><Plus className="h-4 w-4" /> Add Product</Link>
        </Button>
      </div>

      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Category</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">SKU</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Price</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Stock</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(products as Product[] ?? []).map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-brand-charcoal truncate max-w-[200px]">{product.name}</p>
                      {product.brand && <p className="text-xs text-gray-400">{product.brand}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {(product.category as { name: string } | null)?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{product.sku ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatPrice(product.retail_price)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-medium ${product.inventory_quantity === 0 ? 'text-red-600' : product.inventory_quantity < product.reorder_threshold ? 'text-orange-600' : 'text-gray-600'}`}>
                      {product.inventory_quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={product.is_active ? 'default' : 'secondary'}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/admin/products/${product.id}`}><Edit className="h-3.5 w-3.5" /> Edit</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
