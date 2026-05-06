import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ReferralClient } from './ReferralClient'
import type { Profile, Referral } from '@/types'

export const metadata = { title: 'Referrals — My Corner Store' }

export default async function ReferralsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/account/referrals')

  const [{ data: profile }, { data: referrals }] = await Promise.all([
    supabase
      .from('profiles')
      .select('referral_code, store_credit, loyalty_points')
      .eq('id', user.id)
      .single(),
    supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  return (
    <ReferralClient
      profile={profile as Profile}
      referrals={(referrals ?? []) as Referral[]}
    />
  )
}
