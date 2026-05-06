import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils/format'

export const metadata = { title: 'Inventory — Admin' }

export default async function AdminInventoryPage() {
  const supabase = await createClient()

  const { data: lowStock } = await supabase
    .from('products')
    .select('id, name, sku, retail_price, inventory_quantity, reorder_threshold, category:categories(name)')
    .eq('is_active', true)
    .filter('inventory_quantity', 'lte', supabase.from('products').select('reorder_threshold'))
    .order('inventory_quantity')
    .limit(100)

  // Fallback: get all products with low stock
  const { data: products } = await supabase
    .from('products')
    .select('id, name, sku, retail_price, inventory_quantity, reorder_threshold, category:categories(name)')
    .eq('is_active', true)
    .order('inventory_quantity')
    .limit(200)

  const lowItems = (products ?? []).filter(
    (p) => p.inventory_quantity <= p.reorder_threshold
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-charcoal mb-2">Inventory — Low Stock</h1>
      <p className="text-gray-500 mb-6">Products at or below their reorder threshold.</p>

      {lowItems.length === 0 ? (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-12 text-center">
          <div className="text-5xl mb-3">🎉</div>
          <p className="font-semibold text-brand-charcoal">All products well stocked!</p>
          <p className="text-gray-400 text-sm mt-1">No items below reorder threshold.</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Product</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">SKU</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Category</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Price</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Stock</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Threshold</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lowItems.map((p) => (
                <tr key={p.id} className={p.inventory_quantity === 0 ? 'bg-red-50' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}`} className="font-medium text-brand-green hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{p.sku ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{((p.category as unknown as { name: string } | null))?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-right">{formatPrice(p.retail_price)}</td>
                  <td className="px-4 py-3 text-right font-bold">
                    <span className={p.inventory_quantity === 0 ? 'text-red-600' : 'text-orange-600'}>
                      {p.inventory_quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400">{p.reorder_threshold}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/products/${p.id}`} className="text-xs text-brand-green hover:underline font-medium">
                      Restock
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
