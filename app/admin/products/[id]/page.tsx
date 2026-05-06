import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductForm } from '@/components/admin/ProductForm'
import type { Category, Product } from '@/types'

export const metadata = { title: 'Edit Product — Admin' }

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from('products').select('*').eq('id', id).single(),
    supabase.from('categories').select('*').order('name'),
  ])

  if (!product) notFound()

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-charcoal mb-6">Edit Product</h1>
      <ProductForm product={product as Product} categories={(categories ?? []) as Category[]} />
    </div>
  )
}
