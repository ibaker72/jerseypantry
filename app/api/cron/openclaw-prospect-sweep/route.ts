// OpenClaw Prospect Sweep — Tuesdays & Thursdays at 10am ET
// Finds 5 North Jersey businesses, verifies contact emails, and creates leads.
// Trigger: Vercel Cron  `0 14 * * 2,4`  (14:00 UTC = 10:00 AM ET)

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { findProspects, verifyEmail } from '@/lib/openclaw/prospector'
import { sendTelegramMessage } from '@/lib/openclaw/telegram'

const PROSPECTS_PER_SWEEP = 5

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  return req.headers.get('authorization') === `Bearer ${secret}`
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const results = { found: 0, verified: 0, inserted: 0, skipped: 0 }

  try {
    const prospects = await findProspects(PROSPECTS_PER_SWEEP)
    results.found = prospects.length

    if (prospects.length === 0) {
      await sendTelegramMessage(
        `🐾 *OpenClaw Prospect Sweep* — No prospects found.\n` +
        `Make sure GOOGLE_MAPS_API_KEY is set in your environment.`
      )
      return NextResponse.json({ ok: true, ...results })
    }

    const insertedLeads: string[] = []

    for (const prospect of prospects) {
      // Skip if we already have a lead for this business name
      const { data: existing } = await supabase
        .from('office_refill_leads')
        .select('id')
        .ilike('business_name', prospect.business_name)
        .limit(1)
        .single()

      if (existing) {
        results.skipped++
        continue
      }

      // Try to verify a contact email via Hunter.io if we have a website
      let email = `contact@${prospect.website?.replace(/https?:\/\//, '').split('/')[0] ?? ''}`.toLowerCase()
      let emailVerified = false

      if (prospect.website) {
        const domain = prospect.website.replace(/https?:\/\//, '').split('/')[0]
        // We don't have a contact name yet, so use generic first/last for pattern guessing
        const verify = await verifyEmail(domain, 'info', '')
        if (verify.valid || verify.reason === 'risky') {
          email = verify.email
          emailVerified = verify.valid
          results.verified++
        }
      }

      // Skip prospects where we couldn't build a usable email
      if (!email || email === 'contact@') {
        results.skipped++
        continue
      }

      const { error } = await supabase.from('office_refill_leads').insert({
        business_name: prospect.business_name,
        contact_name: null,
        email,
        phone: prospect.phone,
        business_type: prospect.business_type,
        estimated_budget: null,
        message: `OpenClaw sweep — ${prospect.address}, ${prospect.city}, ${prospect.state} ${prospect.postal_code}`,
        status: 'new',
        source: 'openclaw_sweep',
        next_follow_up_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      })

      if (!error) {
        results.inserted++
        insertedLeads.push(`${prospect.business_name} (${prospect.city})`)
      } else {
        console.error('[OpenClaw/ProspectSweep] Insert error:', error)
      }
    }

    // Telegram summary
    const summaryLines = [
      `🐾 *OpenClaw Prospect Sweep* — ${new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`,
      '',
      `Found: ${results.found}  |  Verified: ${results.verified}  |  Added: ${results.inserted}  |  Skipped: ${results.skipped}`,
    ]
    if (insertedLeads.length > 0) {
      summaryLines.push('', `*New Leads:*`)
      insertedLeads.forEach((name) => summaryLines.push(`  • ${name}`))
    }
    if (results.inserted === 0) {
      summaryLines.push('', `_No new leads added — all prospects already in pipeline or missing emails._`)
    }

    await sendTelegramMessage(summaryLines.join('\n'))

    return NextResponse.json({ ok: true, ...results })
  } catch (err) {
    console.error('[OpenClaw/ProspectSweep] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
