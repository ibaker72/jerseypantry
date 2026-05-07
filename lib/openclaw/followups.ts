import { createAdminClient } from '@/lib/supabase/admin'

// Follow-up schedule (days since last_contacted_at or created_at)
export const FOLLOWUP_DAYS = [3, 7, 14] as const

// A lead is dead if it has 3+ unanswered follow-ups OR is 30+ days old with no response
export const MAX_FOLLOWUPS = 3
export const DEAD_AFTER_DAYS = 30

export interface LeadForFollowup {
  id: string
  business_name: string
  contact_name: string | null
  email: string
  status: string
  follow_up_count: number
  last_contacted_at: string | null
  created_at: string
  next_follow_up_at: string | null
}

export async function getLeadsDueForFollowup(): Promise<LeadForFollowup[]> {
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('office_refill_leads')
    .select('id, business_name, contact_name, email, status, follow_up_count, last_contacted_at, created_at, next_follow_up_at')
    .in('status', ['new', 'contacted'])
    .lte('next_follow_up_at', now)
    .order('next_follow_up_at', { ascending: true })
    .limit(50)

  if (error) {
    console.error('[OpenClaw/Followups] Query error:', error)
    return []
  }

  return data ?? []
}

export async function getLeadsDueForDeath(): Promise<LeadForFollowup[]> {
  const supabase = createAdminClient()
  const deadlinePassed = new Date(Date.now() - DEAD_AFTER_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('office_refill_leads')
    .select('id, business_name, contact_name, email, status, follow_up_count, last_contacted_at, created_at, next_follow_up_at')
    .in('status', ['new', 'contacted'])
    .or(`follow_up_count.gte.${MAX_FOLLOWUPS},created_at.lte.${deadlinePassed}`)

  if (error) {
    console.error('[OpenClaw/Followups] Death query error:', error)
    return []
  }

  return data ?? []
}

export async function markLeadContacted(leadId: string, followUpCount: number): Promise<void> {
  const supabase = createAdminClient()
  const now = new Date()
  const nextFollowUpDays = FOLLOWUP_DAYS[followUpCount] ?? null
  const next = nextFollowUpDays
    ? new Date(now.getTime() + nextFollowUpDays * 24 * 60 * 60 * 1000).toISOString()
    : null

  await supabase
    .from('office_refill_leads')
    .update({
      status: 'contacted',
      follow_up_count: followUpCount + 1,
      last_contacted_at: now.toISOString(),
      next_follow_up_at: next,
    })
    .eq('id', leadId)
}

export async function markLeadDead(leadId: string, reason: '3_unanswered' | '30_days_elapsed'): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('office_refill_leads')
    .update({
      status: 'dead',
      dead_reason: reason,
      next_follow_up_at: null,
    })
    .eq('id', leadId)
}

export function getFollowupSubject(businessName: string, followUpCount: number): string {
  const subjects: Record<number, string> = {
    0: `Office snack & drink delivery for ${businessName}`,
    1: `Quick follow-up — My Corner Store`,
    2: `Last check-in — office supply delivery`,
  }
  return subjects[followUpCount] ?? `Following up — My Corner Store`
}

export function getFollowupDayLabel(followUpCount: number): string {
  const days: Record<number, string> = { 0: 'day 3', 1: 'day 7', 2: 'day 14' }
  return days[followUpCount] ?? `follow-up ${followUpCount + 1}`
}
