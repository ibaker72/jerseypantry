import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { B2BAccountDetail } from './B2BAccountDetail'
import { B2BAccountBilling } from './B2BAccountBilling'
import type {
  BusinessAccount,
  BusinessMember,
  BusinessCatalogItem,
  DeliverySchedule,
  BusinessInvoice,
  Order,
} from '@/types'

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

  const [
    { data: account },
    { data: members },
    { data: catalog },
    { data: schedule },
    { data: products },
    { data: invoices },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from('business_accounts').select('*').eq('id', id).single(),
    supabase.from('business_members').select('*').eq('business_id', id).order('created_at'),
    supabase
      .from('business_catalogs')
      .select('*, product:products(id, name, retail_price, sku, image_url, category_id)')
      .eq('business_id', id)
      .order('created_at'),
    supabase.from('delivery_schedules').select('*').eq('business_id', id).order('created_at'),
    supabase.from('products').select('id, name, retail_price, sku').eq('is_active', true).order('name'),
    supabase
      .from('business_invoices')
      .select('*')
      .eq('business_id', id)
      .order('created_at', { ascending: false })
      .limit(12),
    supabase
      .from('orders')
      .select('id, order_number, status, total, created_at')
      .eq('business_account_id', id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  if (!account) notFound()

  return (
    <div className="space-y-6">
      <B2BAccountDetail
        account={account as BusinessAccount}
        members={(members ?? []) as BusinessMember[]}
        catalog={(catalog ?? []) as BusinessCatalogItem[]}
        schedules={(schedule ?? []) as DeliverySchedule[]}
        allProducts={products ?? []}
      />
      <B2BAccountBilling
        account={account as BusinessAccount}
        invoices={(invoices ?? []) as BusinessInvoice[]}
        recentOrders={(recentOrders ?? []) as Pick<Order, 'id' | 'order_number' | 'status' | 'total' | 'created_at'>[]}
      />
    </div>
  )
}
