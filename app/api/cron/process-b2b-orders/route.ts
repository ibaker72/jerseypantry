import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateB2BOrderForAccount } from '@/lib/b2b/generateB2BOrder'
import type { BusinessAccount } from '@/types'

// Runs daily — generates a delivery order for every active business account
// whose delivery schedule lands on today's day-of-week (America/New_York).
//
// Idempotent: re-runs the same day are no-ops thanks to b2b_order_runs PK.
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = createAdminClient()

  // Day-of-week in store TZ (handles DST)
  const dowStr = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'America/New_York' })
    .format(new Date())
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(dowStr)
  if (dow < 0) {
    return NextResponse.json({ error: 'TZ resolution failed' }, { status: 500 })
  }

  const { data: schedules, error } = await supabase
    .from('delivery_schedules')
    .select('id, business_id, frequency, day_of_week, delivery_address, next_delivery_at, last_delivery_at, account:business_accounts(*)')
    .eq('is_active', true)
    .eq('day_of_week', dow)

  if (error) {
    console.error('process-b2b-orders schedule query error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  type Row = {
    id: string
    business_id: string
    frequency: 'weekly' | 'biweekly' | 'monthly'
    day_of_week: number | null
    delivery_address: Record<string, string> | null
    next_delivery_at: string | null
    last_delivery_at: string | null
    account: BusinessAccount | null
  }

  let created = 0
  let skipped = 0
  const results: Array<{ business_id: string; status: string; reason?: string; order_id?: string }> = []
  const now = new Date()

  for (const row of (schedules ?? []) as unknown as Row[]) {
    const account = row.account
    if (!account) {
      skipped++
      results.push({ business_id: row.business_id, status: 'skipped', reason: 'no_account' })
      continue
    }

    // For biweekly: only run if last_delivery_at was >= 13 days ago (or null).
    if (row.frequency === 'biweekly' && row.last_delivery_at) {
      const last = new Date(row.last_delivery_at).getTime()
      const days = (now.getTime() - last) / 86_400_000
      if (days < 13) {
        skipped++
        results.push({ business_id: row.business_id, status: 'skipped', reason: 'biweekly_not_due' })
        continue
      }
    }
    // For monthly: only run on the day_of_week of the first matching week of the month.
    if (row.frequency === 'monthly' && row.last_delivery_at) {
      const last = new Date(row.last_delivery_at).getTime()
      const days = (now.getTime() - last) / 86_400_000
      if (days < 27) {
        skipped++
        results.push({ business_id: row.business_id, status: 'skipped', reason: 'monthly_not_due' })
        continue
      }
    }

    const result = await generateB2BOrderForAccount(supabase, account, {
      runDate: now,
      schedule: { delivery_address: row.delivery_address, frequency: row.frequency },
    })

    if (result.status === 'created') {
      created++
      results.push({ business_id: row.business_id, status: 'created', order_id: result.order_id })

      // Advance the schedule
      const next = new Date(now)
      const step = row.frequency === 'weekly' ? 7 : row.frequency === 'biweekly' ? 14 : 28
      next.setDate(next.getDate() + step)
      await supabase
        .from('delivery_schedules')
        .update({ last_delivery_at: now.toISOString(), next_delivery_at: next.toISOString() })
        .eq('id', row.id)
    } else {
      skipped++
      results.push({ business_id: row.business_id, status: 'skipped', reason: result.reason })
    }
  }

  return NextResponse.json({
    day_of_week: dow,
    schedules: schedules?.length ?? 0,
    created,
    skipped,
    results,
  })
}

export async function GET(req: NextRequest) {
  return POST(req)
}
