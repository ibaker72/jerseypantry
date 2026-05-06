import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin() {
  const serverClient = await createClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) return null
  const supabase = createAdminClient()
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? supabase : null
}

export async function POST(req: NextRequest) {
  const supabase = await requireAdmin()
  if (!supabase) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { business_name, contact_name, contact_email, contact_phone, business_type, plan_name, billing_type, delivery_notes } = body

  if (!business_name || !contact_email) {
    return NextResponse.json({ error: 'business_name and contact_email required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('business_accounts')
    .insert({
      business_name,
      contact_name: contact_name || null,
      contact_email,
      contact_phone: contact_phone || null,
      business_type: business_type || null,
      plan_name: plan_name ?? 'starter',
      billing_type: billing_type ?? 'card',
      delivery_notes: delivery_notes || null,
      subscription_status: 'pending',
      status: 'active',
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id }, { status: 201 })
}
