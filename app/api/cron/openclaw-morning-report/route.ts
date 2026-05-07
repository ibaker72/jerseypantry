// OpenClaw Morning Report — Mon–Fri at 8am ET
// Sends a Telegram message with revenue, alerts, and B2B pipeline summary.
// Trigger: Vercel Cron  `0 12 * * 1-5`  (12:00 UTC = 8:00 AM ET)

import { NextRequest, NextResponse } from 'next/server'
import { getMorningReportData, formatMorningReport } from '@/lib/openclaw/reports'
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

  try {
    const data = await getMorningReportData()
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
    })
    const message = formatMorningReport(data, today)
    await sendTelegramMessage(message)

    return NextResponse.json({
      ok: true,
      revenueToday: data.revenueToday,
      ordersToday: data.ordersToday,
      stuckOrders: data.stuckOrders.length,
      lowStock: data.lowStockProducts.length,
    })
  } catch (err) {
    console.error('[OpenClaw/MorningReport] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
