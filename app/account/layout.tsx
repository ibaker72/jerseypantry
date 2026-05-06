import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AccountSidebar } from '@/components/account/AccountSidebar'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/account')

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-brand-charcoal mb-8">My Account</h1>
      <div className="flex flex-col md:flex-row gap-6">
        <AccountSidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}
