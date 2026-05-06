import { createClient } from '@/lib/supabase/server'
import { BundleBuilderClient } from './BundleBuilderClient'
import type { Product, Category } from '@/types'

export const metadata = {
  title: 'Bundle Builder — My Corner Store',
  description: 'Pick any 4+ products and save 10% on your custom bundle.',
}

export default async function BundleBuilderPage() {
  const supabase = await createClient()

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('is_active', true)
      .eq('is_bundle', false)
      .gt('inventory_quantity', 0)
      .order('name'),
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="rounded-3xl bg-gradient-to-br from-brand-orange to-amber-600 text-white p-8 sm:p-10 mb-10">
        <p className="text-orange-200 text-sm font-medium mb-2">Customize &amp; Save</p>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Bundle Builder</h1>
        <p className="text-orange-100 max-w-lg leading-relaxed">
          Pick any 4 or more products and automatically get <strong>10% off</strong> your entire selection.
        </p>
      </div>
      <BundleBuilderClient
        products={(products ?? []) as Product[]}
        categories={(categories ?? []) as Category[]}
      />
    </div>
  )
}
