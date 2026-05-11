import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ReceiveLotForm } from '@/components/admin/ReceiveLotForm'
import type { Product, Supplier } from '@/types'

export const metadata = { title: 'Receive Shipment — Admin' }

export default async function ReceiveLotPage() {
  const supabase = await createClient()
  const [{ data: products }, { data: suppliers }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, sku, brand, inventory_quantity')
      .eq('is_active', true)
      .order('name')
      .limit(500),
    supabase
      .from('suppliers')
      .select('id, name')
      .eq('is_active', true)
      .order('name'),
  ])

  return (
    <div>
      <Link
        href="/admin/inventory/lots"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-green mb-3"
      >
        <ArrowLeft className="h-4 w-4" /> Back to lots
      </Link>
      <h1 className="text-2xl font-bold text-brand-charcoal mb-2">Receive Shipment</h1>
      <p className="text-gray-500 text-sm mb-6">
        Logs a new lot with cost and expiration, then increments product stock.
      </p>
      <ReceiveLotForm
        products={(products ?? []) as Pick<Product, 'id' | 'name' | 'sku' | 'brand' | 'inventory_quantity'>[]}
        suppliers={(suppliers ?? []) as Pick<Supplier, 'id' | 'name'>[]}
      />
    </div>
  )
}
