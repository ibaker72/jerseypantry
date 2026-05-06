import { createClient } from '@/lib/supabase/server'
import { ProductForm } from '@/components/admin/ProductForm'
import type { Category } from '@/types'

export const metadata = { title: 'New Product — Admin' }

export default async function NewProductPage() {
  const supabase = await createClient()
  const { data: categories } = await supabase.from('categories').select('*').order('name')

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-charcoal mb-6">Add New Product</h1>
      <ProductForm categories={(categories ?? []) as Category[]} />
    </div>
  )
}
