import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendB2BDunningEmail, sendB2BSuspensionEmail } from '@/lib/email/resend'
import type { BusinessAccount, BusinessInvoice } from '@/types'

// Daily dunning sweep — escalates past_due accounts through 3 email stages
// and suspends after the final stage. Idempotent: checks last_dunning_sent_at
// on the related invoice before re-sending.
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = createAdminClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const portalUrl = `${siteUrl}/account/business`

  const { data: accounts, error } = await supabase
    .from('business_accounts')
    .select('*')
    .eq('subscription_status', 'past_due')
    .neq('status', 'canceled')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const now = Date.now()
  const STAGE_DAYS = [0, 3, 7] as const
  const STAGE_THRESHOLD_HOURS = 18

  const results: Array<{ business_id: string; action: string; stage?: number }> = []

  for (const ba of (accounts ?? []) as BusinessAccount[]) {
    const sinceFailureMs = ba.last_failure_at ? now - new Date(ba.last_failure_at).getTime() : 0
    const daysSinceFailure = Math.floor(sinceFailureMs / 86_400_000)

    let nextStage: 1 | 2 | 3 | null = null
    for (let i = STAGE_DAYS.length - 1; i >= 0; i--) {
      if (daysSinceFailure >= STAGE_DAYS[i] && ba.dunning_stage < i + 1) {
        nextStage = (i + 1) as 1 | 2 | 3
        break
      }
    }

    if (!nextStage) {
      results.push({ business_id: ba.id, action: 'no_stage_due' })
      continue
    }

    // Find the most recent open invoice for this account
    const { data: invoiceRow } = await supabase
      .from('business_invoices')
      .select('*')
      .eq('business_id', ba.id)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    const invoice = invoiceRow as BusinessInvoice | null

    // Skip if we already sent a dunning email for this stage recently
    if (invoice?.last_dunning_sent_at) {
      const elapsedHrs = (now - new Date(invoice.last_dunning_sent_at).getTime()) / 3_600_000
      if (elapsedHrs < STAGE_THRESHOLD_HOURS) {
        results.push({ business_id: ba.id, action: 'too_soon', stage: nextStage })
        continue
      }
    }

    await sendB2BDunningEmail({
      to: ba.contact_email,
      business_name: ba.business_name,
      stage: nextStage,
      amount_due: invoice?.amount_due ?? 0,
      due_date: invoice?.due_date ?? null,
      invoice_pdf_url: invoice?.invoice_pdf_url ?? null,
      portal_url: portalUrl,
    })

    await supabase.from('business_accounts').update({ dunning_stage: nextStage }).eq('id', ba.id)
    if (invoice) {
      await supabase
        .from('business_invoices')
        .update({
          dunning_attempts: invoice.dunning_attempts + 1,
          last_dunning_sent_at: new Date().toISOString(),
        })
        .eq('id', invoice.id)
    }

    results.push({ business_id: ba.id, action: 'dunning_sent', stage: nextStage })

    // Suspension on stage 3
    if (nextStage === 3) {
      await supabase
        .from('business_accounts')
        .update({ status: 'suspended', suspended_at: new Date().toISOString() })
        .eq('id', ba.id)
      await sendB2BSuspensionEmail({
        to: ba.contact_email,
        business_name: ba.business_name,
        portal_url: portalUrl,
      })
      results.push({ business_id: ba.id, action: 'suspended' })
    }
  }

  return NextResponse.json({ total: accounts?.length ?? 0, results })
}

export async function GET(req: NextRequest) {
  return POST(req)
}
