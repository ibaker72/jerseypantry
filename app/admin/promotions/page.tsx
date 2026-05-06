import { createAdminClient } from '@/lib/supabase/admin'
import { PromotionsClient } from './PromotionsClient'
import type { Promotion } from '@/types'

export const metadata = { title: 'Promotions — Admin' }

export default async function PromotionsPage() {
  const supabase = createAdminClient()
  const [{ data: promos }, { data: categories }] = await Promise.all([
    supabase.from('promotions').select('*').order('created_at', { ascending: false }),
    supabase.from('categories').select('id, name').eq('is_active', true).order('name'),
  ])

  return (
    <PromotionsClient
      initialPromos={(promos ?? []) as Promotion[]}
      categories={categories ?? []}
    />
  )
}
