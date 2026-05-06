import { CsvImporter } from './CsvImporter'
import { createClient } from '@/lib/supabase/server'
import type { Category } from '@/types'

export const metadata = { title: 'CSV Import — Admin' }

export default async function AdminImportPage() {
  const supabase = await createClient()
  const { data: categories } = await supabase.from('categories').select('*').order('name')

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-charcoal mb-2">CSV Product Import</h1>
      <p className="text-gray-500 mb-6">
        Upload or paste a CSV to bulk import or update products. Products are matched by SKU — existing products are updated, new ones are created.
      </p>
      <CsvImporter categories={(categories ?? []) as Category[]} />
    </div>
  )
}
