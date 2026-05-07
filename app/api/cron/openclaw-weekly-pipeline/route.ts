// OpenClaw Weekly Pipeline — Mondays at 8am ET
// Sends a Telegram message with funnel stats, hot leads, and recommendations.
// Trigger: Vercel Cron  `0 12 * * 1`  (12:00 UTC = 8:00 AM ET, Mondays only)

import { NextRequest, NextResponse } from 'next/server'
import { getWeeklyPipelineData, formatWeeklyPipeline } from '@/lib/openclaw/reports'
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
    const data = await getWeeklyPipelineData()
    const weekOf = new Date().toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })
    const message = formatWeeklyPipeline(data, weekOf)
    await sendTelegramMessage(message)

    return NextResponse.json({
      ok: true,
      totalLeads: data.totalLeads,
      qualifiedLeads: data.qualifiedLeads,
      mrr: data.mrr,
      hotLeads: data.hotLeads.length,
    })
  } catch (err) {
    console.error('[OpenClaw/WeeklyPipeline] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
