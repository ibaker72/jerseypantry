'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type {
  CourierQuoteRequest,
  CourierQuoteResponse,
  DispatchDecision,
  DispatchOrder,
  DispatchStatus,
} from '@/types/wholesale'

// ── Constants ────────────────────────────────────────────────────────────────

const SELF_DELIVERY_MAX_WEIGHT_LBS = 50
const SELF_DELIVERY_MAX_DISTANCE_MILES = 5

// ── Dispatch Decision Logic ──────────────────────────────────────────────────

export function determineDeliveryType(
  weight_lbs: number,
  distance_miles: number | null
): DispatchDecision {
  const withinWeight = weight_lbs < SELF_DELIVERY_MAX_WEIGHT_LBS
  const withinDistance =
    distance_miles === null || distance_miles <= SELF_DELIVERY_MAX_DISTANCE_MILES

  if (withinWeight && withinDistance) {
    return {
      delivery_type: 'self_delivery',
      reason: `Order is under ${SELF_DELIVERY_MAX_WEIGHT_LBS} lbs and within ${SELF_DELIVERY_MAX_DISTANCE_MILES} miles.`,
      courier_eligible: true,
      weight_lbs,
      distance_miles,
    }
  }

  const reasons: string[] = []
  if (!withinWeight) reasons.push(`weight ${weight_lbs} lbs exceeds ${SELF_DELIVERY_MAX_WEIGHT_LBS} lbs limit`)
  if (!withinDistance && distance_miles !== null)
    reasons.push(`distance ${distance_miles} mi exceeds ${SELF_DELIVERY_MAX_DISTANCE_MILES} mi limit`)

  return {
    delivery_type: 'courier',
    reason: `Bulk/overweight: ${reasons.join(', ')}.`,
    courier_eligible: true,
    weight_lbs,
    distance_miles,
  }
}

// ── Mock Courier API ─────────────────────────────────────────────────────────
// Swap the body of this function to call DoorDash Drive or Uber Direct.

export async function requestCourierQuote(
  req: CourierQuoteRequest
): Promise<CourierQuoteResponse> {
  // TODO: replace with real API call
  // DoorDash Drive: POST https://openapi.doordash.com/drive/v2/quotes
  // Uber Direct:    POST https://api.uber.com/v1/customers/{id}/delivery_quotes

  const baseFee = 8.99
  const weightSurcharge = req.total_weight_lbs > 50 ? Math.ceil((req.total_weight_lbs - 50) / 10) * 1.5 : 0
  const fee = +(baseFee + weightSurcharge).toFixed(2)

  return {
    quote_id: `mock_${Date.now()}`,
    provider: 'doordash',
    fee,
    eta_minutes: 45,
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  }
}

// ── dispatchOrder Server Action ──────────────────────────────────────────────

export async function dispatchOrder(
  order_id: string,
  total_weight_lbs: number,
  distance_miles: number | null,
  notes?: string
): Promise<{ success: boolean; dispatch?: DispatchOrder; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const admin = createAdminClient()

    // Check if dispatch already exists
    const { data: existing } = await admin
      .from('dispatch_orders')
      .select('id')
      .eq('order_id', order_id)
      .maybeSingle()

    if (existing) return { success: false, error: 'Dispatch already created for this order' }

    const decision = determineDeliveryType(total_weight_lbs, distance_miles)

    const { data, error } = await admin
      .from('dispatch_orders')
      .insert({
        order_id,
        total_weight_lbs,
        distance_miles,
        delivery_type: decision.delivery_type,
        status: 'pending_pickup',
        notes: notes ?? null,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    return { success: true, dispatch: data as DispatchOrder }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

// ── updateDispatchStatus Server Action ───────────────────────────────────────

export async function updateDispatchStatus(
  dispatch_id: string,
  status: DispatchStatus,
  extra?: { driver_name?: string; courier_tracking_url?: string; courier_fee?: number; notes?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const admin = createAdminClient()

    const timestampField: Partial<Record<string, string>> = {}
    if (status === 'picked_up_from_wholesaler') timestampField.pickup_confirmed_at = new Date().toISOString()
    if (status === 'out_for_delivery') timestampField.out_for_delivery_at = new Date().toISOString()
    if (status === 'delivered') timestampField.delivered_at = new Date().toISOString()

    const { error } = await admin
      .from('dispatch_orders')
      .update({ status, ...timestampField, ...extra })
      .eq('id', dispatch_id)

    if (error) return { success: false, error: error.message }

    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

// ── attachCourierQuote Server Action ─────────────────────────────────────────

export async function attachCourierQuote(
  dispatch_id: string,
  quote: CourierQuoteResponse
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const admin = createAdminClient()

    const { error } = await admin
      .from('dispatch_orders')
      .update({
        courier_provider: quote.provider,
        courier_quote_id: quote.quote_id,
        courier_fee: quote.fee,
        delivery_type: 'courier',
      })
      .eq('id', dispatch_id)

    if (error) return { success: false, error: error.message }

    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
