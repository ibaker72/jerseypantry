import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendB2BInviteEmail } from '@/lib/email/resend'

export async function POST(req: NextRequest) {
  const serverClient = await createClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { business_id, email, role = 'member', spend_limit } = await req.json()
  if (!business_id || !email) return NextResponse.json({ error: 'business_id and email required' }, { status: 400 })

  const supabase = createAdminClient()

  // Verify the caller is an owner or admin
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  if (!isAdmin) {
    const { data: callerMembership } = await supabase
      .from('business_members')
      .select('role')
      .eq('business_id', business_id)
      .eq('user_id', user.id)
      .single()
    if (!callerMembership || callerMembership.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can invite members' }, { status: 403 })
    }
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from('business_members')
    .select('id')
    .eq('business_id', business_id)
    .eq('email', email)
    .single()

  if (existing) return NextResponse.json({ error: 'Already a member' }, { status: 409 })

  // Generate invite token
  const inviteToken = crypto.randomUUID()

  const { data: member, error } = await supabase
    .from('business_members')
    .insert({
      business_id,
      email,
      role,
      spend_limit: spend_limit ?? null,
      invite_token: inviteToken,
      invite_sent_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send invite email (best-effort)
  const { data: ba } = await supabase
    .from('business_accounts')
    .select('business_name')
    .eq('id', business_id)
    .single()

  await sendB2BInviteEmail({
    to: email,
    business_name: ba?.business_name ?? 'Your Company',
    invite_token: inviteToken,
    role,
  })

  return NextResponse.json({ member }, { status: 201 })
}
