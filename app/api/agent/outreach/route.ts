import { NextRequest, NextResponse } from 'next/server'
import { requireAgentKey, agentSupabase } from '@/lib/agent/auth'
import { sendProspectOutreachEmail, sendLeadFollowUpEmail } from '@/lib/email/resend'

// GET /api/agent/outreach?lead_id=<uuid> — outreach history for a lead
export async function GET(req: NextRequest) {
  const deny = requireAgentKey(req)
  if (deny) return deny

  const supabase = agentSupabase()
  const lead_id = req.nextUrl.searchParams.get('lead_id')
  if (!lead_id) return NextResponse.json({ error: 'lead_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('outreach_log')
    .select('*')
    .eq('lead_id', lead_id)
    .order('sent_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ log: data })
}

// POST /api/agent/outreach
// Body: { lead_id, type: 'initial_outreach'|'follow_up', plan_suggestion?, custom_hook?, sent_by? }
export async function POST(req: NextRequest) {
  const deny = requireAgentKey(req)
  if (deny) return deny

  const supabase = agentSupabase()
  const body = await req.json()
  const { lead_id, type, plan_suggestion = 'standard', custom_hook, sent_by = 'agent' } = body

  if (!lead_id) return NextResponse.json({ error: 'lead_id required' }, { status: 400 })
  if (!type || !['initial_outreach', 'follow_up'].includes(type)) {
    return NextResponse.json({ error: 'type must be initial_outreach or follow_up' }, { status: 400 })
  }

  // Fetch lead
  const { data: lead, error: leadErr } = await supabase
    .from('office_refill_leads')
    .select('id, business_name, email, contact_name, business_type, status')
    .eq('id', lead_id)
    .single()

  if (leadErr || !lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  if (lead.status === 'dead') return NextResponse.json({ error: 'Cannot contact a dead lead' }, { status: 422 })
  if (lead.status === 'converted') return NextResponse.json({ error: 'Lead is already converted' }, { status: 422 })

  // Check last outreach to prevent same-day spam
  const { data: lastLog } = await supabase
    .from('outreach_log')
    .select('sent_at')
    .eq('lead_id', lead_id)
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lastLog) {
    const hoursSinceLast = (Date.now() - new Date(lastLog.sent_at).getTime()) / 3600000
    if (hoursSinceLast < 20) {
      return NextResponse.json(
        { error: `Last outreach was ${Math.round(hoursSinceLast)}h ago — wait 20h before sending again` },
        { status: 429 }
      )
    }
  }

  // Send email
  let subject: string
  let message_id: string | null = null

  try {
    if (type === 'initial_outreach') {
      const result = await sendProspectOutreachEmail({
        to: lead.email,
        business_name: lead.business_name,
        business_type: lead.business_type ?? 'corporate_office',
        contact_name: lead.contact_name ?? undefined,
        plan_suggestion,
        custom_hook,
      })
      subject = result.subject
      message_id = result.message_id
    } else {
      const daysSinceLast = lastLog
        ? Math.round((Date.now() - new Date(lastLog.sent_at).getTime()) / 86400000)
        : 7
      const result = await sendLeadFollowUpEmail({
        to: lead.email,
        business_name: lead.business_name,
        contact_name: lead.contact_name ?? undefined,
        last_contact_days: daysSinceLast,
        plan_suggestion,
      })
      subject = result.subject
      message_id = result.message_id
    }
  } catch (err: any) {
    return NextResponse.json({ error: `Email send failed: ${err.message}` }, { status: 502 })
  }

  // Log outreach
  const { data: logEntry, error: logErr } = await supabase
    .from('outreach_log')
    .insert({
      lead_id,
      type: 'email',
      subject,
      body_summary: `${type} — plan: ${plan_suggestion}`,
      sent_by,
      resend_message_id: message_id,
    })
    .select()
    .single()

  if (logErr) {
    console.error('Failed to log outreach:', logErr)
  }

  // Advance status: new → contacted on initial outreach
  let new_status = lead.status
  if (type === 'initial_outreach' && lead.status === 'new') {
    await supabase
      .from('office_refill_leads')
      .update({ status: 'contacted' })
      .eq('id', lead_id)
      .eq('status', 'new') // guard against race
    new_status = 'contacted'
  }

  return NextResponse.json({
    ok: true,
    lead_id,
    subject,
    new_status,
    log_entry: logEntry ?? null,
  })
}
