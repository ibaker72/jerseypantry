import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  createDelivery,
  DoorDashApiError,
  normalizeDeliveryStatus,
} from '@/lib/delivery/doordash/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const customerSchema = z.object({
  given_name: z.string().min(1),
  family_name: z.string().optional(),
  phone: z.string().min(7),
  address: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(2),
    postal_code: z.string().min(5),
    country: z.string().default('US'),
    delivery_instructions: z.string().optional(),
  }),
  contactless: z.boolean().optional(),
  tip_cents: z.number().int().nonnegative().optional(),
})

const bodySchema = z.object({
  orderId: z.string().uuid(),
  customer: customerSchema,
})

function pickupConfig() {
  const address = process.env.STORE_PICKUP_ADDRESS
  const name = process.env.STORE_PICKUP_NAME ?? process.env.NEXT_PUBLIC_STORE_NAME
  const phone = process.env.STORE_PICKUP_PHONE
  const instructions = process.env.STORE_PICKUP_INSTRUCTIONS

  if (!address || !name || !phone) {
    throw new Error('Missing pickup configuration (STORE_PICKUP_ADDRESS / NAME / PHONE)')
  }
  return { address, name, phone, instructions }
}

function formatAddress(a: z.infer<typeof customerSchema>['address']): string {
  const line = [a.line1, a.line2].filter(Boolean).join(' ')
  return `${line}, ${a.city}, ${a.state} ${a.postal_code}, ${a.country || 'US'}`
}

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_request', issues: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { orderId, customer } = parsed.data
  const supabase = createAdminClient()

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('id, order_number, total, status, delivery_tracking_id')
    .eq('id', orderId)
    .single()

  if (orderErr || !order) {
    return NextResponse.json({ error: 'order_not_found' }, { status: 404 })
  }

  if (order.status !== 'paid' && order.status !== 'preparing') {
    return NextResponse.json(
      { error: 'order_not_ready', detail: `Order status is "${order.status}"` },
      { status: 409 }
    )
  }

  if (order.delivery_tracking_id) {
    return NextResponse.json(
      { error: 'delivery_already_exists', delivery_tracking_id: order.delivery_tracking_id },
      { status: 409 }
    )
  }

  const orderValueCents = Math.round(Number(order.total) * 100)
  if (!Number.isFinite(orderValueCents) || orderValueCents <= 0) {
    return NextResponse.json({ error: 'invalid_order_total' }, { status: 400 })
  }

  const pickup = pickupConfig()
  const externalDeliveryId = `mcs_${order.order_number}_${Date.now()}`

  const requestPayload = {
    external_delivery_id: externalDeliveryId,
    pickup_address: pickup.address,
    pickup_business_name: pickup.name,
    pickup_phone_number: pickup.phone,
    pickup_instructions: pickup.instructions,
    dropoff_address: formatAddress(customer.address),
    dropoff_phone_number: customer.phone,
    dropoff_contact_given_name: customer.given_name,
    dropoff_contact_family_name: customer.family_name,
    dropoff_instructions: customer.address.delivery_instructions,
    order_value: orderValueCents,
    currency: 'USD',
    tip: customer.tip_cents,
    contactless_dropoff: customer.contactless ?? false,
  }

  try {
    const { data: delivery, statusCode, raw } = await createDelivery(requestPayload)

    const normalizedStatus = normalizeDeliveryStatus(delivery.delivery_status) ?? 'created'

    await supabase
      .from('orders')
      .update({
        delivery_tracking_id: externalDeliveryId,
        delivery_status: normalizedStatus,
        tracking_url: delivery.tracking_url ?? null,
        delivery_provider: 'doordash',
        delivery_provider_fee_cents: delivery.fee ?? null,
        delivery_updated_at: new Date().toISOString(),
        status: 'out_for_delivery',
      })
      .eq('id', orderId)

    await supabase.from('delivery_logs').insert({
      order_id: orderId,
      delivery_tracking_id: externalDeliveryId,
      provider: 'doordash',
      direction: 'outbound',
      event_type: 'create_delivery',
      status_code: statusCode,
      request_payload: requestPayload,
      response_payload: raw as object,
    })

    return NextResponse.json({
      ok: true,
      delivery_tracking_id: externalDeliveryId,
      delivery_status: normalizedStatus,
      tracking_url: delivery.tracking_url ?? null,
      fee_cents: delivery.fee ?? null,
      pickup_time_estimated: delivery.pickup_time_estimated ?? null,
      dropoff_time_estimated: delivery.dropoff_time_estimated ?? null,
    })
  } catch (err) {
    const isDDErr = err instanceof DoorDashApiError
    const statusCode = isDDErr ? err.statusCode : 500
    const code = isDDErr ? err.code : 'internal_error'
    const message = err instanceof Error ? err.message : 'Unknown delivery error'

    await supabase.from('delivery_logs').insert({
      order_id: orderId,
      delivery_tracking_id: externalDeliveryId,
      provider: 'doordash',
      direction: 'outbound',
      event_type: 'create_delivery',
      status_code: statusCode,
      request_payload: requestPayload,
      response_payload: isDDErr ? (err.responseBody as object) : null,
      error_message: message,
    })

    // Friendly mapping for the common, recoverable cases.
    const userFacing = mapErrorCode(code, message)

    return NextResponse.json(
      { error: userFacing.code, message: userFacing.message, provider_code: code },
      { status: userFacing.httpStatus }
    )
  }
}

function mapErrorCode(
  code: string | undefined,
  message: string
): { code: string; message: string; httpStatus: number } {
  const c = (code ?? '').toLowerCase()
  const m = message.toLowerCase()

  if (c.includes('address') || m.includes('address')) {
    return {
      code: 'invalid_address',
      message: 'We could not validate that delivery address. Please verify it and try again.',
      httpStatus: 422,
    }
  }
  if (c.includes('no_dasher') || m.includes('no dashers') || m.includes('no driver')) {
    return {
      code: 'no_dashers_available',
      message:
        'No drivers are available in your area right now. Please try again in a few minutes.',
      httpStatus: 503,
    }
  }
  if (c.includes('outside_service') || m.includes('outside')) {
    return {
      code: 'outside_service_area',
      message: 'That address is outside our delivery range.',
      httpStatus: 422,
    }
  }
  if (c.includes('phone')) {
    return {
      code: 'invalid_phone',
      message: 'The phone number provided was rejected by the delivery provider.',
      httpStatus: 422,
    }
  }
  return {
    code: 'delivery_failed',
    message: 'Could not create delivery. Our team has been notified.',
    httpStatus: 502,
  }
}
