import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { B2BAccountDetail } from './B2BAccountDetail'
import type { BusinessAccount, BusinessMember, BusinessCatalogItem, DeliverySchedule } from '@/types'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data } = await supabase.from('business_accounts').select('business_name').eq('id', id).single()
  return { title: `${data?.business_name ?? 'Account'} — Admin` }
}

export default async function AccountDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = createAdminClient()

  const [{ data: account }, { data: members }, { data: catalog }, { data: schedule }, { data: products }] =
    await Promise.all([
      supabase.from('business_accounts').select('*').eq('id', id).single(),
      supabase.from('business_members').select('*').eq('business_id', id).order('created_at'),
      supabase
        .from('business_catalogs')
        .select('*, product:products(id, name, retail_price, sku, image_url, category_id)')
        .eq('business_id', id)
        .order('created_at'),
      supabase.from('delivery_schedules').select('*').eq('business_id', id).order('created_at'),
      supabase.from('products').select('id, name, retail_price, sku').eq('is_active', true).order('name'),
    ])

  if (!account) notFound()

  return (
    <B2BAccountDetail
      account={account as BusinessAccount}
      members={(members ?? []) as BusinessMember[]}
      catalog={(catalog ?? []) as BusinessCatalogItem[]}
      schedules={(schedule ?? []) as DeliverySchedule[]}
      allProducts={products ?? []}
    />
  )
}
