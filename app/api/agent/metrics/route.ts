import { NextRequest, NextResponse } from 'next/server'
import { requireAgentKey, agentSupabase } from '@/lib/agent/auth'

// GET /api/agent/metrics
// Returns a business overview snapshot: revenue, orders, low stock count, B2B accounts
export async function GET(req: NextRequest) {
  const deny = requireAgentKey(req)
  if (deny) return deny

  const supabase = agentSupabase()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 7)

  const [
    { data: todayOrders },
    { data: weekOrders },
    { data: pendingOrders, count: pendingCount },
    { data: lowStock, count: lowStockCount },
    { data: b2bAccounts, count: b2bCount },
    { data: openInvoices },
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('total')
      .gte('created_at', todayStart.toISOString())
      .eq('status', 'delivered'),
    supabase
      .from('orders')
      .select('total, created_at')
      .gte('created_at', weekStart.toISOString()),
    supabase
      .from('orders')
      .select('id, created_at, total, status', { count: 'exact' })
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('products')
      .select('id, name, stock_quantity', { count: 'exact' })
      .lt('stock_quantity', 10)
      .eq('is_active', true),
    supabase
      .from('business_accounts')
      .select('id, business_name, subscription_status', { count: 'exact' })
      .eq('status', 'active'),
    supabase
      .from('business_invoices')
      .select('id, business_id, amount_due, due_date')
      .eq('status', 'open'),
  ])

  const todayRevenue = (todayOrders ?? []).reduce((s, o) => s + (o.total ?? 0), 0)
  const weekRevenue = (weekOrders ?? []).reduce((s, o) => s + (o.total ?? 0), 0)
  const weekOrderCount = (weekOrders ?? []).length

  return NextResponse.json({
    snapshot_at: new Date().toISOString(),
    today: {
      revenue: todayRevenue,
      revenue_formatted: `$${todayRevenue.toFixed(2)}`,
    },
    week: {
      revenue: weekRevenue,
      revenue_formatted: `$${weekRevenue.toFixed(2)}`,
      order_count: weekOrderCount,
    },
    pending_orders: {
      count: pendingCount ?? 0,
      items: pendingOrders ?? [],
    },
    inventory: {
      low_stock_count: lowStockCount ?? 0,
      low_stock_items: (lowStock ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        stock_quantity: p.stock_quantity,
      })),
    },
    b2b: {
      active_account_count: b2bCount ?? 0,
      open_invoice_count: (openInvoices ?? []).length,
      open_invoice_total: (openInvoices ?? []).reduce((s, i) => s + (i.amount_due ?? 0), 0) / 100,
      accounts: b2bAccounts ?? [],
    },
  })
}
