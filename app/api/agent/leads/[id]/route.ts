import { NextRequest, NextResponse } from 'next/server'
import { requireAgentKey, agentSupabase } from '@/lib/agent/auth'

// GET /api/agent/leads/:id — full lead + outreach history + linked business account
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const deny = requireAgentKey(req)
  if (deny) return deny

  const supabase = agentSupabase()
  const { id } = params

  const { data: lead, error } = await supabase
    .from('office_refill_leads')
    .select(
      `*, outreach_log(*)`,
    )
    .eq('id', id)
    .single()

  if (error || !lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  // If converted, fetch linked business account
  let business_account = null
  if (lead.status === 'converted') {
    const { data: ba } = await supabase
      .from('business_accounts')
      .select('id, business_name, plan_name, subscription_status, contact_email, created_at')
      .eq('lead_id', id)
      .maybeSingle()
    business_account = ba
  }

  return NextResponse.json({ lead, business_account })
}

// PATCH /api/agent/leads/:id — update lead fields
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const deny = requireAgentKey(req)
  if (deny) return deny

  const supabase = agentSupabase()
  const { id } = params
  const body = await req.json()

  const allowed = [
    'status', 'notes', 'agent_notes', 'contact_name', 'phone',
    'website', 'estimated_budget', 'business_type', 'city', 'state',
    'address', 'postal_code',
  ]

  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  // Validate status transitions (only forward)
  if (updates.status) {
    const pipeline = ['new', 'contacted', 'qualified', 'proposal_sent', 'converted', 'dead']
    const { data: current } = await supabase
      .from('office_refill_leads')
      .select('status')
      .eq('id', id)
      .single()

    if (!current) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

    const currentIdx = pipeline.indexOf(current.status)
    const newIdx = pipeline.indexOf(updates.status as string)
    // Allow 'dead' from any status; otherwise only forward
    if (updates.status !== 'dead' && newIdx < currentIdx) {
      return NextResponse.json(
        { error: `Cannot move status backward from '${current.status}' to '${updates.status}'` },
        { status: 422 }
      )
    }
  }

  const { data, error } = await supabase
    .from('office_refill_leads')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ lead: data })
}
