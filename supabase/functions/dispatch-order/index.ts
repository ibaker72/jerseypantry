import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SELF_DELIVERY_MAX_WEIGHT_LBS = 50
const SELF_DELIVERY_MAX_DISTANCE_MILES = 5

interface DispatchRequest {
  order_id: string
  total_weight_lbs: number
  distance_miles?: number | null
  notes?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const body: DispatchRequest = await req.json()
    const { order_id, total_weight_lbs, distance_miles, notes } = body

    if (!order_id || total_weight_lbs === undefined) {
      return Response.json({ error: 'order_id and total_weight_lbs are required' }, { status: 400 })
    }

    // Check for existing dispatch
    const { data: existing } = await supabase
      .from('dispatch_orders')
      .select('id')
      .eq('order_id', order_id)
      .maybeSingle()

    if (existing) {
      return Response.json({ error: 'Dispatch already exists for this order' }, { status: 409 })
    }

    // Determine delivery type
    const withinWeight = total_weight_lbs < SELF_DELIVERY_MAX_WEIGHT_LBS
    const withinDistance =
      distance_miles === null ||
      distance_miles === undefined ||
      distance_miles <= SELF_DELIVERY_MAX_DISTANCE_MILES

    const delivery_type = withinWeight && withinDistance ? 'self_delivery' : 'courier'

    const { data, error } = await supabase
      .from('dispatch_orders')
      .insert({
        order_id,
        total_weight_lbs,
        distance_miles: distance_miles ?? null,
        delivery_type,
        status: 'pending_pickup',
        notes: notes ?? null,
      })
      .select()
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })

    return Response.json({ success: true, dispatch: data, delivery_type })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
})
