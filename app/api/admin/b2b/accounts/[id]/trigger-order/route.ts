import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateB2BOrderForAccount } from '@/lib/b2b/generateB2BOrder'
import type { BusinessAccount } from '@/types'

async function requireAdmin() {
  const serverClient = await createClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) return null
  const supabase = createAdminClient()
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? supabase : null
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await requireAdmin()
  if (!supabase) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: account } = await supabase.from('business_accounts').select('*').eq('id', id).single()
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const result = await generateB2BOrderForAccount(supabase, account as BusinessAccount)
  return NextResponse.json(result)
}
