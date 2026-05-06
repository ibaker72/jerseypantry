import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SubscriptionsClient } from './SubscriptionsClient'
import type { Subscription } from '@/types'

export const metadata = { title: 'Subscriptions — My Corner Store' }

export default async function SubscriptionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/account/subscriptions')

  const adminClient = createAdminClient()
  const { data: subs } = await adminClient
    .from('subscriptions')
    .select('*, product:products(id, name, image_url, retail_price, slug, brand, size)')
    .eq('user_id', user.id)
    .neq('status', 'canceled')
    .order('created_at', { ascending: false })

  return <SubscriptionsClient initialSubs={(subs ?? []) as Subscription[]} />
}
