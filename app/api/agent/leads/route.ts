import { NextRequest, NextResponse } from 'next/server'
import { requireAgentKey, agentSupabase } from '@/lib/agent/auth'

// GET /api/agent/leads?status=new&source=agent_prospected&search=gym&limit=50&page=1
export async function GET(req: NextRequest) {
  const deny = requireAgentKey(req)
  if (deny) return deny

  const supabase = agentSupabase()
  const { searchParams } = req.nextUrl
  const status = searchParams.get('status')
  const source = searchParams.get('source')
  const search = searchParams.get('search')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const offset = (page - 1) * limit

  let query = supabase
    .from('office_refill_leads')
    .select(
      `id, business_name, contact_name, email, phone, business_type,
       estimated_budget, status, lead_source, city, state, website,
       notes, agent_notes, created_at, updated_at,
       outreach_log(id, type, sent_at, subject)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)
  if (source) query = query.eq('lead_source', source)
  if (search) {
    query = query.or(
      `business_name.ilike.%${search}%,email.ilike.%${search}%,city.ilike.%${search}%`
    )
  }

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    leads: data,
    total: count,
    page,
    pages: Math.ceil((count ?? 0) / limit),
  })
}

// POST /api/agent/leads — create agent-prospected lead (deduplicates by email)
export async function POST(req: NextRequest) {
  const deny = requireAgentKey(req)
  if (deny) return deny

  const supabase = agentSupabase()
  const body = await req.json()

  const {
    business_name,
    email,
    contact_name,
    phone,
    business_type,
    estimated_budget,
    lead_source = 'agent_prospected',
    address,
    city,
    state = 'NJ',
    postal_code,
    website,
    notes,
    agent_notes,
  } = body

  if (!business_name) return NextResponse.json({ error: 'business_name required' }, { status: 400 })
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  // Deduplicate by email
  const { data: existing } = await supabase
    .from('office_refill_leads')
    .select('id, status')
    .eq('email', email)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: 'Lead with this email already exists', existing_id: existing.id, existing_status: existing.status },
      { status: 409 }
    )
  }

  const { data, error } = await supabase
    .from('office_refill_leads')
    .insert({
      business_name,
      email,
      contact_name: contact_name ?? null,
      phone: phone ?? null,
      business_type: business_type ?? null,
      estimated_budget: estimated_budget ?? null,
      lead_source,
      address: address ?? null,
      city: city ?? null,
      state,
      postal_code: postal_code ?? null,
      website: website ?? null,
      notes: notes ?? null,
      agent_notes: agent_notes ?? null,
      status: 'new',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ lead: data }, { status: 201 })
}
