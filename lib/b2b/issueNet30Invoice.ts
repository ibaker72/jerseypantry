import type { SupabaseClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'
import type { B2BPlan } from '@/types'

const PLAN_AMOUNT_ENV: Record<B2BPlan, string> = {
  starter: 'STRIPE_B2B_STARTER_AMOUNT_CENTS',
  standard: 'STRIPE_B2B_STANDARD_AMOUNT_CENTS',
  premium: 'STRIPE_B2B_PREMIUM_AMOUNT_CENTS',
}

const FALLBACK_CENTS: Record<B2BPlan, number> = {
  starter: 9900,
  standard: 19900,
  premium: 39900,
}

export type IssueResult =
  | { status: 'issued'; invoice_id: string }
  | { status: 'skipped'; reason: string }

export async function issueNet30Invoice(params: {
  supabase: SupabaseClient
  stripe: Stripe
  account: {
    id: string
    plan_name: B2BPlan
    business_name: string
    stripe_customer_id: string | null
  }
  periodStart: Date
}): Promise<IssueResult> {
  const { supabase, stripe, account, periodStart } = params
  if (!account.stripe_customer_id) return { status: 'skipped', reason: 'no_stripe_customer' }

  const periodKey = periodStart.toISOString().slice(0, 10)

  const { error: claimErr } = await supabase
    .from('b2b_invoice_runs')
    .insert({ business_id: account.id, period_start: periodKey })

  if (claimErr) {
    if ((claimErr as { code?: string }).code === '23505') {
      return { status: 'skipped', reason: 'already_invoiced_for_period' }
    }
    return { status: 'skipped', reason: `claim_failed: ${claimErr.message}` }
  }

  const amountCents = parseInt(process.env[PLAN_AMOUNT_ENV[account.plan_name]] ?? '', 10) || FALLBACK_CENTS[account.plan_name]

  try {
    await stripe.invoiceItems.create({
      customer: account.stripe_customer_id,
      amount: amountCents,
      currency: 'usd',
      description: `Office Refill — ${account.plan_name} (${periodStart.toLocaleString('en-US', { month: 'short', year: 'numeric' })})`,
    })

    const invoice = await stripe.invoices.create({
      customer: account.stripe_customer_id,
      collection_method: 'send_invoice',
      days_until_due: 30,
      auto_advance: true,
      metadata: {
        b2b: 'true',
        business_id: account.id,
        period_start: periodKey,
      },
    })

    if (invoice.id) {
      await stripe.invoices.finalizeInvoice(invoice.id)
    }

    await supabase
      .from('b2b_invoice_runs')
      .update({ stripe_invoice_id: invoice.id })
      .eq('business_id', account.id)
      .eq('period_start', periodKey)

    return { status: 'issued', invoice_id: invoice.id ?? '' }
  } catch (err) {
    await supabase.from('b2b_invoice_runs').delete()
      .eq('business_id', account.id).eq('period_start', periodKey)
    return { status: 'skipped', reason: `stripe_error: ${(err as Error).message}` }
  }
}
