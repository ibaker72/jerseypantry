import { createAdminClient } from '@/lib/supabase/admin'
import { FlashSalesClient } from './FlashSalesClient'
import type { FlashSale } from '@/types'

export const metadata = { title: 'Flash Sales — Admin' }

export default async function FlashSalesPage() {
  const supabase = createAdminClient()

  const [{ data: sales }, { data: products }, { data: categories }] = await Promise.all([
    supabase
      .from('flash_sales')
      .select('*')
      .order('ends_at', { ascending: false }),
    supabase
      .from('products')
      .select('id, name, sku, retail_price')
      .eq('is_active', true)
      .order('name'),
    supabase.from('categories').select('id, name').eq('is_active', true).order('name'),
  ])

  return (
    <FlashSalesClient
      initialSales={(sales ?? []) as FlashSale[]}
      products={products ?? []}
      categories={categories ?? []}
    />
  )
}
