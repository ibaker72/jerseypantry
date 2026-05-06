import { NextRequest, NextResponse } from 'next/server'
import { requireAgentKey } from '@/lib/agent/auth'

// POST /api/agent/notify  { message, channel? }
// Sends an outbound notification via OpenClaw's configured webhook URL.
// OpenClaw can also call this endpoint to relay messages from Telegram/WhatsApp back into the store.
export async function POST(req: NextRequest) {
  const deny = requireAgentKey(req)
  if (deny) return deny

  const { message, channel = 'default', metadata } = await req.json()
  if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 })

  const webhookUrl = process.env.OPENCLAW_WEBHOOK_URL
  if (!webhookUrl) {
    // Log locally if no webhook configured
    console.log(`[Agent notify][${channel}] ${message}`, metadata ?? '')
    return NextResponse.json({ ok: true, delivered: false, reason: 'OPENCLAW_WEBHOOK_URL not set' })
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, channel, metadata, sent_at: new Date().toISOString() }),
    })
    if (!res.ok) {
      const body = await res.text()
      return NextResponse.json({ ok: false, error: body }, { status: 502 })
    }
    return NextResponse.json({ ok: true, delivered: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 502 })
  }
}

// GET /api/agent/notify — OpenClaw polls this to check if the store wants to send it instructions
// Returns any queued messages (currently a no-op placeholder for future use)
export async function GET(req: NextRequest) {
  const deny = requireAgentKey(req)
  if (deny) return deny
  return NextResponse.json({ messages: [] })
}
