import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params
  const serverClient = await createClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()

  // Verify the target member exists
  const { data: target } = await supabase.from('business_members').select('business_id, role').eq('id', memberId).single()
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (target.role === 'owner') return NextResponse.json({ error: 'Cannot remove owner' }, { status: 400 })

  // Caller must be admin or owner of the same business
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    const { data: callerMember } = await supabase
      .from('business_members')
      .select('role')
      .eq('business_id', target.business_id)
      .eq('user_id', user.id)
      .single()
    if (!callerMember || callerMember.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const { error } = await supabase.from('business_members').delete().eq('id', memberId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
