import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWholesaleCatalog } from '@/lib/wholesale/inventory'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: member } = await admin
    .from('business_members')
    .select('business_id')
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null)
    .maybeSingle()

  if (!member) return NextResponse.json({ error: 'No business account' }, { status: 403 })

  const products = await getWholesaleCatalog(member.business_id)
  return NextResponse.json({ products })
}
