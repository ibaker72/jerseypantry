// PATCH /api/leads/[id] — update a lead's status (admin only)
// When status transitions to "qualified", OpenClaw fires a close assist alert.

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendCloseAssistAlert } from '@/lib/openclaw/proposals'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Auth check — admin only
  const supabaseUser = await createClient()
  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json() as {
    status?: string
    notes?: string
    follow_up_count?: number
    next_follow_up_at?: string | null
  }

  // Fetch current lead to detect status transitions
  const { data: current, error: fetchError } = await supabase
    .from('office_refill_leads')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !current) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  // Build update payload — only include provided fields
  const update: Record<string, unknown> = {}
  if (body.status !== undefined) update.status = body.status
  if (body.notes !== undefined) update.notes = body.notes
  if (body.follow_up_count !== undefined) update.follow_up_count = body.follow_up_count
  if (body.next_follow_up_at !== undefined) update.next_follow_up_at = body.next_follow_up_at

  const { data: updated, error: updateError } = await supabase
    .from('office_refill_leads')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Close Assist — fire Telegram alert when lead becomes qualified
  if (body.status === 'qualified' && current.status !== 'qualified') {
    try {
      await sendCloseAssistAlert({
        id: updated.id,
        business_name: updated.business_name,
        contact_name: updated.contact_name ?? null,
        email: updated.email,
        business_type: updated.business_type ?? null,
        estimated_budget: updated.estimated_budget ?? null,
        notes: updated.notes ?? null,
        follow_up_count: updated.follow_up_count,
      })
    } catch (err) {
      // Non-fatal — log but don't fail the request
      console.error('[OpenClaw/CloseAssist] Failed to send alert:', err)
    }
  }

  return NextResponse.json(updated)
}
