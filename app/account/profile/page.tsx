import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from './ProfileForm'
import type { Profile } from '@/types'

export const metadata = { title: 'Profile — My Corner Store' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/account/profile')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
      <h2 className="font-semibold text-brand-charcoal mb-5">Profile</h2>
      <ProfileForm profile={profile as Profile} />
    </div>
  )
}
