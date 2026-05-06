import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Called after a new user signs up — applies their referrer's code
// Body: { referral_code: string }
export async function POST(req: NextRequest) {
  const serverClient = await createClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { referral_code } = await req.json()
  if (!referral_code) return NextResponse.json({ error: 'referral_code required' }, { status: 400 })

  const supabase = createAdminClient()

  // Find referrer
  const { data: referrer } = await supabase
    .from('profiles')
    .select('id')
    .eq('referral_code', referral_code.toUpperCase())
    .single()

  if (!referrer) return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 })
  if (referrer.id === user.id) return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 })

  // Make sure this user hasn't already been referred
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('referred_by')
    .eq('id', user.id)
    .single()

  if (existingProfile?.referred_by) {
    return NextResponse.json({ error: 'Already claimed a referral' }, { status: 409 })
  }

  // Mark referred_by on the new user's profile
  await supabase
    .from('profiles')
    .update({ referred_by: referrer.id })
    .eq('id', user.id)

  // Create pending referral record
  const userEmail = user.email
  await supabase.from('referrals').insert({
    referrer_id: referrer.id,
    referred_user_id: user.id,
    referred_email: userEmail,
    status: 'pending',
  })

  return NextResponse.json({ ok: true })
}
