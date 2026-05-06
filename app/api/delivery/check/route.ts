import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkDeliveryEligibility } from '@/lib/delivery/zones'
import type { DeliveryZone } from '@/types'

export async function GET(req: NextRequest) {
  const zip = req.nextUrl.searchParams.get('zip')
  if (!zip || zip.length < 5) {
    return NextResponse.json({ available: false, reason: 'Invalid ZIP code' }, { status: 400 })
  }

  try {
    const supabase = createAdminClient()
    const { data: zones } = await supabase
      .from('delivery_zones')
      .select('*')
      .eq('is_active', true)

    const result = checkDeliveryEligibility(zip, (zones ?? []) as DeliveryZone[])
    return NextResponse.json(result)
  } catch (err) {
    console.error('Delivery check error:', err)
    return NextResponse.json({ available: false, reason: 'Could not check delivery zones' }, { status: 500 })
  }
}
