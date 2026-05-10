import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe/client'
import { issueNet30Invoice } from '@/lib/b2b/issueNet30Invoice'
import type { BusinessAccount } from '@/types'

// Monthly cron — issues a net30 Stripe invoice for every active net30 account.
// Runs on the 1st of the month at 8am UTC. Idempotent via b2b_invoice_runs.
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = createAdminClient()
  const stripe = getStripe()

  const { data: accounts, error } = await supabase
    .from('business_accounts')
    .select('*')
    .eq('billing_type', 'net30')
    .eq('status', 'active')
    .not('stripe_customer_id', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Period start = first day of current month UTC
  const now = new Date()
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))

  const results: Array<{ business_id: string; status: string; reason?: string; invoice_id?: string }> = []
  let issued = 0
  let skipped = 0

  for (const account of (accounts ?? []) as BusinessAccount[]) {
    const result = await issueNet30Invoice({ supabase, stripe, account, periodStart })
    if (result.status === 'issued') {
      issued++
      results.push({ business_id: account.id, status: 'issued', invoice_id: result.invoice_id })
    } else {
      skipped++
      results.push({ business_id: account.id, status: 'skipped', reason: result.reason })
    }
  }

  return NextResponse.json({ total: accounts?.length ?? 0, issued, skipped, results })
}

export async function GET(req: NextRequest) {
  return POST(req)
}
