// OpenClaw Follow-up Sweep — Mon/Wed/Fri at 9am ET
// Sends 3/7/14-day follow-ups and marks dead leads (3 unanswered or 30 days old).
// Trigger: Vercel Cron  `0 13 * * 1,3,5`  (13:00 UTC = 9:00 AM ET)

import { NextRequest, NextResponse } from 'next/server'
import {
  getLeadsDueForFollowup,
  getLeadsDueForDeath,
  markLeadContacted,
  markLeadDead,
  getFollowupSubject,
  getFollowupDayLabel,
} from '@/lib/openclaw/followups'
import { sendFollowupEmail } from '@/lib/email/resend'
import { sendTelegramMessage } from '@/lib/openclaw/telegram'

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  return req.headers.get('authorization') === `Bearer ${secret}`
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = { followupsSent: 0, markedDead: 0, errors: 0 }

  try {
    // 1. Send follow-ups to leads that are due
    const dueLeads = await getLeadsDueForFollowup()

    for (const lead of dueLeads) {
      try {
        const dayLabel = getFollowupDayLabel(lead.follow_up_count)
        console.log(`[OpenClaw/Followup] Sending ${dayLabel} to ${lead.email} (${lead.business_name})`)

        await sendFollowupEmail({
          to: lead.email,
          business_name: lead.business_name,
          contact_name: lead.contact_name,
          follow_up_count: lead.follow_up_count,
        })

        await markLeadContacted(lead.id, lead.follow_up_count)
        results.followupsSent++
      } catch (err) {
        console.error(`[OpenClaw/Followup] Error for lead ${lead.id}:`, err)
        results.errors++
      }
    }

    // 2. Mark dead leads (max follow-ups exceeded or 30 days old)
    const deadLeads = await getLeadsDueForDeath()

    for (const lead of deadLeads) {
      const createdAt = new Date(lead.created_at)
      const ageMs = Date.now() - createdAt.getTime()
      const ageDays = ageMs / (1000 * 60 * 60 * 24)

      const reason: '3_unanswered' | '30_days_elapsed' =
        lead.follow_up_count >= 3 ? '3_unanswered' : '30_days_elapsed'

      await markLeadDead(lead.id, reason)
      results.markedDead++

      console.log(`[OpenClaw/Followup] Marked dead: ${lead.business_name} (${reason}, ${Math.round(ageDays)}d old)`)
    }

    // Telegram summary (only if something happened)
    if (results.followupsSent > 0 || results.markedDead > 0) {
      const lines = [
        `🐾 *OpenClaw Follow-up Sweep* — ${new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`,
        '',
        `Emails sent: ${results.followupsSent}`,
        `Leads marked dead: ${results.markedDead}`,
      ]
      if (results.errors > 0) {
        lines.push(`⚠️ Errors: ${results.errors} — check server logs`)
      }
      await sendTelegramMessage(lines.join('\n'))
    }

    return NextResponse.json({ ok: true, ...results })
  } catch (err) {
    console.error('[OpenClaw/FollowupSweep] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
