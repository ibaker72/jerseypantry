import { createAdminClient } from '@/lib/supabase/admin'

export interface MorningReportData {
  // Revenue
  revenueToday: number
  revenueYesterday: number
  revenueThisWeek: number
  revenueLastWeek: number
  ordersToday: number
  // Alerts
  stuckOrders: { id: string; order_number: string; status: string; minutes: number }[]
  lowStockProducts: { name: string; sku: string; inventory_quantity: number; reorder_threshold: number }[]
  // B2B pipeline
  newLeads: number
  contactedLeads: number
  qualifiedLeads: number
  leadsAddedToday: number
}

export interface WeeklyPipelineData {
  // Funnel
  totalLeads: number
  newLeads: number
  contactedLeads: number
  qualifiedLeads: number
  convertedThisWeek: number
  deadThisWeek: number
  // Rates
  contactRate: number     // contacted / new
  qualifyRate: number     // qualified / contacted
  convertRate: number     // converted / qualified
  // Hot leads — qualified but not yet converted
  hotLeads: { business_name: string; contact_name: string | null; email: string; qualified_at: string; follow_up_count: number }[]
  // Subscription MRR
  activeB2BAccounts: number
  mrr: number
  // Prospects added via sweep this week
  sweepLeadsThisWeek: number
}

export async function getMorningReportData(): Promise<MorningReportData> {
  const supabase = createAdminClient()

  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Sunday
  const lastWeekStart = new Date(weekStart)
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)

  const [
    { data: todayOrders },
    { data: yesterdayOrders },
    { data: thisWeekOrders },
    { data: lastWeekOrders },
    { data: stuckOrders },
    { data: lowStock },
    { data: leads },
    { data: todayLeads },
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('total')
      .eq('status', 'paid')
      .gte('created_at', todayStart.toISOString()),
    supabase
      .from('orders')
      .select('total')
      .eq('status', 'paid')
      .gte('created_at', yesterdayStart.toISOString())
      .lt('created_at', todayStart.toISOString()),
    supabase
      .from('orders')
      .select('total')
      .eq('status', 'paid')
      .gte('created_at', weekStart.toISOString()),
    supabase
      .from('orders')
      .select('total')
      .eq('status', 'paid')
      .gte('created_at', lastWeekStart.toISOString())
      .lt('created_at', weekStart.toISOString()),
    // Orders stuck in "preparing" or "paid" for more than 2 hours
    supabase
      .from('orders')
      .select('id, order_number, status, updated_at')
      .in('status', ['paid', 'preparing'])
      .lt('updated_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()),
    supabase
      .from('products')
      .select('name, sku, inventory_quantity, reorder_threshold')
      .eq('is_active', true)
      .filter('inventory_quantity', 'lte', 'reorder_threshold'),
    supabase
      .from('office_refill_leads')
      .select('status'),
    supabase
      .from('office_refill_leads')
      .select('id')
      .gte('created_at', todayStart.toISOString()),
  ])

  const sum = (rows: { total: number }[] | null) =>
    (rows ?? []).reduce((acc, r) => acc + r.total, 0)

  const stuckWithMinutes = (stuckOrders ?? []).map((o) => ({
    id: o.id,
    order_number: o.order_number,
    status: o.status,
    minutes: Math.floor((Date.now() - new Date(o.updated_at).getTime()) / 60000),
  }))

  // Filter low stock more precisely (Supabase can't do column comparisons in filter)
  const lowStockFiltered = (lowStock ?? []).filter(
    (p) => p.inventory_quantity <= p.reorder_threshold
  )

  const leadCounts = (leads ?? []).reduce(
    (acc, l) => {
      acc[l.status as string] = (acc[l.status as string] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return {
    revenueToday: sum(todayOrders),
    revenueYesterday: sum(yesterdayOrders),
    revenueThisWeek: sum(thisWeekOrders),
    revenueLastWeek: sum(lastWeekOrders),
    ordersToday: (todayOrders ?? []).length,
    stuckOrders: stuckWithMinutes,
    lowStockProducts: lowStockFiltered,
    newLeads: leadCounts['new'] ?? 0,
    contactedLeads: leadCounts['contacted'] ?? 0,
    qualifiedLeads: leadCounts['qualified'] ?? 0,
    leadsAddedToday: (todayLeads ?? []).length,
  }
}

export async function getWeeklyPipelineData(): Promise<WeeklyPipelineData> {
  const supabase = createAdminClient()

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const [
    { data: allLeads },
    { data: hotLeads },
    { data: convertedThisWeek },
    { data: deadThisWeek },
    { data: sweepLeads },
    { data: b2bAccounts },
  ] = await Promise.all([
    supabase.from('office_refill_leads').select('status'),
    supabase
      .from('office_refill_leads')
      .select('business_name, contact_name, email, qualified_at, follow_up_count')
      .eq('status', 'qualified')
      .order('qualified_at', { ascending: true }),
    supabase
      .from('office_refill_leads')
      .select('id')
      .eq('status', 'converted')
      .gte('updated_at', weekStart.toISOString()),
    supabase
      .from('office_refill_leads')
      .select('id')
      .eq('status', 'dead')
      .gte('updated_at', weekStart.toISOString()),
    supabase
      .from('office_refill_leads')
      .select('id')
      .eq('source', 'openclaw_sweep')
      .gte('created_at', weekAgo),
    supabase
      .from('business_accounts')
      .select('plan_name, subscription_status')
      .eq('subscription_status', 'active'),
  ])

  const counts = (allLeads ?? []).reduce(
    (acc, l) => {
      acc[l.status as string] = (acc[l.status as string] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  const contacted = counts['contacted'] ?? 0
  const qualified = counts['qualified'] ?? 0
  const newLeads = counts['new'] ?? 0

  const planMrr: Record<string, number> = { starter: 99, standard: 199, premium: 399 }
  const mrr = (b2bAccounts ?? []).reduce(
    (acc, a) => acc + (planMrr[a.plan_name] ?? 0),
    0
  )

  return {
    totalLeads: total,
    newLeads,
    contactedLeads: contacted,
    qualifiedLeads: qualified,
    convertedThisWeek: (convertedThisWeek ?? []).length,
    deadThisWeek: (deadThisWeek ?? []).length,
    contactRate: newLeads > 0 ? Math.round((contacted / newLeads) * 100) : 0,
    qualifyRate: contacted > 0 ? Math.round((qualified / contacted) * 100) : 0,
    convertRate: qualified > 0 ? Math.round(((counts['converted'] ?? 0) / qualified) * 100) : 0,
    hotLeads: hotLeads ?? [],
    activeB2BAccounts: (b2bAccounts ?? []).length,
    mrr,
    sweepLeadsThisWeek: (sweepLeads ?? []).length,
  }
}

export function formatMorningReport(d: MorningReportData, today: string): string {
  const revDelta = d.revenueYesterday > 0
    ? ((d.revenueToday - d.revenueYesterday) / d.revenueYesterday * 100).toFixed(0)
    : '—'
  const weekDelta = d.revenueLastWeek > 0
    ? ((d.revenueThisWeek - d.revenueLastWeek) / d.revenueLastWeek * 100).toFixed(0)
    : '—'

  const lines: string[] = [
    `🐾 *OpenClaw Morning Report* — ${today}`,
    '',
    `*Revenue*`,
    `  Today: $${d.revenueToday.toFixed(2)} (${revDelta}% vs yesterday)`,
    `  This week: $${d.revenueThisWeek.toFixed(2)} (${weekDelta}% vs last week)`,
    `  Orders today: ${d.ordersToday}`,
  ]

  if (d.stuckOrders.length > 0) {
    lines.push('', `⚠️ *Stuck Orders (>2h)*`)
    d.stuckOrders.forEach((o) =>
      lines.push(`  #${o.order_number} — ${o.status} for ${o.minutes}m`)
    )
  }

  if (d.lowStockProducts.length > 0) {
    lines.push('', `📦 *Low Stock*`)
    d.lowStockProducts.slice(0, 5).forEach((p) =>
      lines.push(`  ${p.name} (${p.sku}): ${p.inventory_quantity} left`)
    )
    if (d.lowStockProducts.length > 5) {
      lines.push(`  ...and ${d.lowStockProducts.length - 5} more`)
    }
  }

  lines.push(
    '',
    `*B2B Pipeline*`,
    `  New: ${d.newLeads}  |  Contacted: ${d.contactedLeads}  |  Qualified: ${d.qualifiedLeads}`,
    `  Leads added today: ${d.leadsAddedToday}`,
  )

  if (d.stuckOrders.length === 0 && d.lowStockProducts.length === 0) {
    lines.push('', `✅ No alerts — all clear!`)
  }

  return lines.join('\n')
}

export function formatWeeklyPipeline(d: WeeklyPipelineData, weekOf: string): string {
  const lines: string[] = [
    `🐾 *OpenClaw Weekly Pipeline* — Week of ${weekOf}`,
    '',
    `*Funnel*`,
    `  Total leads: ${d.totalLeads}`,
    `  New → Contacted: ${d.contactRate}%`,
    `  Contacted → Qualified: ${d.qualifyRate}%`,
    `  Qualified → Converted: ${d.convertRate}%`,
    '',
    `*This Week*`,
    `  Converted: ${d.convertedThisWeek}  |  Lost: ${d.deadThisWeek}`,
    `  Sweep leads added: ${d.sweepLeadsThisWeek}`,
    '',
    `*B2B Revenue*`,
    `  Active accounts: ${d.activeB2BAccounts}`,
    `  MRR: $${d.mrr.toFixed(0)}`,
  ]

  if (d.hotLeads.length > 0) {
    lines.push('', `🔥 *Hot Leads (Qualified — needs close)*`)
    d.hotLeads.slice(0, 5).forEach((l) =>
      lines.push(`  ${l.business_name} — ${l.follow_up_count} follow-ups sent`)
    )
  }

  if (d.qualifiedLeads === 0 && d.contactedLeads < 3) {
    lines.push('', `💡 *Recommendation:* Pipeline is thin. Run a manual prospect sweep or expand target geography.`)
  } else if (d.qualifyRate < 20) {
    lines.push('', `💡 *Recommendation:* Low qualify rate. Consider refining your opening pitch or targeting larger offices.`)
  } else if (d.convertRate < 30) {
    lines.push('', `💡 *Recommendation:* Leads are getting stuck at qualified. Send proposals faster — check hot leads above.`)
  }

  return lines.join('\n')
}
