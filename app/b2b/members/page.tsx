import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { B2BMembersClient } from './B2BMembersClient'

export default async function B2BMembersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/b2b/members')

  const admin = createAdminClient()

  const { data: currentMember } = await admin
    .from('business_members')
    .select('business_id, role')
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null)
    .single()

  if (!currentMember) redirect('/office-refill?no_account=1')

  const { data: members } = await admin
    .from('business_members')
    .select('*')
    .eq('business_id', currentMember.business_id)
    .order('created_at', { ascending: true })

  return (
    <B2BMembersClient
      businessId={currentMember.business_id}
      currentUserRole={currentMember.role}
      members={members ?? []}
    />
  )
}
