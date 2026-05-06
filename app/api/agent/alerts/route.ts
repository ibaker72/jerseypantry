import { NextRequest, NextResponse } from 'next/server'
import { requireAgentKey, agentSupabase } from '@/lib/agent/auth'

// GET /api/agent/alerts
// Returns all actionable alerts: low stock, pending orders, past-due B2B invoices, abandoned carts
export async function GET(req: NextRequest) {
  const deny = requireAgentKey(req)
  if (deny) return deny

  const supabase = agentSupabase()
  const now = new Date()
  const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000)
  const twentyFourHAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const [
    { data: lowStock },
    { data: stalePending },
    { data: overdueInvoices },
    { data: abandonedCarts },
    { data: pastDueB2B },
  ] = await Promise.all([
    // Products with stock < 5
    supabase
      .from('products')
      .select('id, name, stock_quantity')
      .lt('stock_quantity', 5)
      .eq('is_active', true)
      .order('stock_quantity', { ascending: true }),

    // Orders stuck in "pending" for > 1 hour
    supabase
      .from('orders')
      .select('id, created_at, total')
      .eq('status', 'pending')
      .lt('created_at', new Date(now.getTime() - 60 * 60 * 1000).toISOString()),

    // B2B invoices past due date
    supabase
      .from('business_invoices')
      .select('id, business_id, amount_due, due_date, business_accounts(business_name)')
      .eq('status', 'open')
      .lt('due_date', now.toISOString()),

    // Abandoned carts (30min–24h, no recovery email sent)
    supabase
      .from('saved_carts')
      .select('id, user_id, updated_at')
      .lt('updated_at', thirtyMinAgo.toISOString())
      .gte('updated_at', twentyFourHAgo.toISOString())
      .is('recovery_email_sent_at', null),

    // B2B accounts with past_due subscription status
    supabase
      .from('business_accounts')
      .select('id, business_name, contact_email, current_period_end')
      .eq('subscription_status', 'past_due'),
  ])

  const alerts = []

  for (const p of lowStock ?? []) {
    alerts.push({
      type: 'low_stock',
      severity: (p.stock_quantity ?? 0) === 0 ? 'critical' : 'warning',
      message: `${p.name} has only ${p.stock_quantity} unit(s) remaining`,
      data: p,
    })
  }

  for (const o of stalePending ?? []) {
    const ageMin = Math.round((now.getTime() - new Date(o.created_at).getTime()) / 60000)
    alerts.push({
      type: 'stale_order',
      severity: 'warning',
      message: `Order ${o.id.slice(0, 8)} has been pending for ${ageMin} minutes`,
      data: o,
    })
  }

  for (const inv of overdueInvoices ?? []) {
    const ba = Array.isArray(inv.business_accounts) ? inv.business_accounts[0] : inv.business_accounts
    alerts.push({
      type: 'overdue_invoice',
      severity: 'critical',
      message: `Invoice for ${ba?.business_name ?? inv.business_id} is past due ($${((inv.amount_due ?? 0) / 100).toFixed(2)})`,
      data: { ...inv, business_name: ba?.business_name },
    })
  }

  for (const cart of abandonedCarts ?? []) {
    alerts.push({
      type: 'abandoned_cart',
      severity: 'info',
      message: `Cart abandoned ${Math.round((now.getTime() - new Date(cart.updated_at).getTime()) / 60000)} minutes ago`,
      data: cart,
    })
  }

  for (const acct of pastDueB2B ?? []) {
    alerts.push({
      type: 'b2b_past_due',
      severity: 'critical',
      message: `B2B account "${acct.business_name}" subscription payment is past due`,
      data: acct,
    })
  }

  const critical = alerts.filter((a) => a.severity === 'critical').length
  const warnings = alerts.filter((a) => a.severity === 'warning').length

  return NextResponse.json({
    checked_at: now.toISOString(),
    summary: { total: alerts.length, critical, warnings, info: alerts.length - critical - warnings },
    alerts,
  })
}
