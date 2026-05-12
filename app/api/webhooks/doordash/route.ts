import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeDeliveryStatus } from '@/lib/delivery/doordash/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Maps a normalized delivery status onto the order's high-level status.
const TERMINAL_DELIVERED = new Set(['delivered'])
const TERMINAL_FAILED = new Set(['canceled', 'returned', 'failed'])

function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.DOORDASH_WEBHOOK_SECRET
  if (!secret) return true // dev mode — skip verification if unset
  if (!signature) return false

  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  const provided = signature.startsWith('sha256=') ? signature.slice(7) : signature

  const a = Buffer.from(expected, 'hex')
  const b = Buffer.from(provided, 'hex')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const sig = req.headers.get('x-doordash-signature') ?? req.headers.get('x-signature')

  if (!verifySignature(rawBody, sig)) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const externalDeliveryId = String(
    payload.external_delivery_id ?? (payload.delivery as Record<string, unknown> | undefined)?.external_delivery_id ?? ''
  )
  const eventType = String(payload.event_name ?? payload.event_type ?? 'unknown')
  const rawStatus = String(
    payload.delivery_status ??
      (payload.delivery as Record<string, unknown> | undefined)?.delivery_status ??
      eventType
  )
  const trackingUrl =
    (payload.tracking_url as string | undefined) ??
    ((payload.delivery as Record<string, unknown> | undefined)?.tracking_url as string | undefined)

  const supabase = createAdminClient()

  if (!externalDeliveryId) {
    await supabase.from('delivery_logs').insert({
      provider: 'doordash',
      direction: 'webhook',
      event_type: eventType,
      request_payload: payload,
      error_message: 'Missing external_delivery_id',
    })
    return NextResponse.json({ error: 'missing_tracking_id' }, { status: 400 })
  }

  const normalized = normalizeDeliveryStatus(rawStatus)

  const { data: order } = await supabase
    .from('orders')
    .select('id, status')
    .eq('delivery_tracking_id', externalDeliveryId)
    .maybeSingle()

  await supabase.from('delivery_logs').insert({
    order_id: order?.id ?? null,
    delivery_tracking_id: externalDeliveryId,
    provider: 'doordash',
    direction: 'webhook',
    event_type: eventType,
    request_payload: payload,
  })

  if (!order) {
    // Ack but flag — DoorDash retries 4xx, so we 200 here to avoid a loop.
    return NextResponse.json({ ok: true, warning: 'order_not_found' })
  }

  const updates: Record<string, unknown> = {
    delivery_updated_at: new Date().toISOString(),
  }
  if (normalized) updates.delivery_status = normalized
  if (trackingUrl) updates.tracking_url = trackingUrl

  if (normalized && TERMINAL_DELIVERED.has(normalized) && order.status !== 'completed') {
    updates.status = 'completed'
  } else if (normalized && TERMINAL_FAILED.has(normalized) && order.status !== 'canceled') {
    updates.status = 'canceled'
  }

  await supabase.from('orders').update(updates).eq('id', order.id)

  return NextResponse.json({ ok: true })
}
