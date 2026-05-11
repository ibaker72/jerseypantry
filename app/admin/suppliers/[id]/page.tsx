import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SupplierForm } from '@/components/admin/SupplierForm'
import { formatPrice } from '@/lib/utils/format'
import type { Supplier, InventoryLot } from '@/types'

export const metadata = { title: 'Edit Supplier — Admin' }

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditSupplierPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .single()
  if (!data) notFound()

  const supplier = data as Supplier

  const { data: lotsData } = await supabase
    .from('inventory_lots')
    .select('*, product:products(id, name, sku)')
    .eq('supplier_id', supplier.id)
    .order('received_at', { ascending: false })
    .limit(20)

  const lots = (lotsData ?? []) as InventoryLot[]

  return (
    <div>
      <Link
        href="/admin/suppliers"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-green mb-3"
      >
        <ArrowLeft className="h-4 w-4" /> Back to suppliers
      </Link>
      <h1 className="text-2xl font-bold text-brand-charcoal mb-6">{supplier.name}</h1>
      <SupplierForm supplier={supplier} />

      <div className="max-w-3xl mt-10">
        <h2 className="text-lg font-semibold text-brand-charcoal mb-3">
          Recent lots from this supplier
        </h2>
        {lots.length === 0 ? (
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-8 text-center text-sm text-gray-400">
            No lots received from this supplier yet.
          </div>
        ) : (
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Product</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Qty</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Unit cost</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Total</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lots.map((lot) => (
                  <tr key={lot.id}>
                    <td className="px-4 py-3 text-brand-charcoal">
                      {lot.product?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {lot.quantity_remaining} / {lot.quantity_received}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatPrice(lot.unit_cost)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatPrice(lot.total_cost)}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(lot.received_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
