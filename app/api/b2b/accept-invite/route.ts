import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST { token } — called after the invited user signs in
export async function POST(req: NextRequest) {
  const serverClient = await createClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 })

  const { token } = await req.json()
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

  const supabase = createAdminClient()

  const { data: member } = await supabase
    .from('business_members')
    .select('id, email, business_id, accepted_at')
    .eq('invite_token', token)
    .single()

  if (!member) return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 })
  if (member.accepted_at) return NextResponse.json({ error: 'Invite already accepted' }, { status: 409 })
  if (member.email.toLowerCase() !== user.email?.toLowerCase()) {
    return NextResponse.json({ error: 'This invite is for a different email address' }, { status: 403 })
  }

  await supabase.from('business_members').update({
    user_id: user.id,
    accepted_at: new Date().toISOString(),
    invite_token: null,
  }).eq('id', member.id)

  return NextResponse.json({ business_id: member.business_id })
}
