import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { B2BSidebar } from '@/components/b2b/B2BSidebar'

export default async function B2BLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/b2b/dashboard')

  const admin = createAdminClient()
  const { data: member } = await admin
    .from('business_members')
    .select('business_id, role, business_accounts(business_name, subscription_status)')
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null)
    .single()

  if (!member) redirect('/office-refill?no_account=1')

  const account = Array.isArray(member.business_accounts)
    ? member.business_accounts[0]
    : member.business_accounts

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row gap-6">
        <B2BSidebar
          businessName={account?.business_name ?? 'My Business'}
          memberRole={member.role as string}
        />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}
