import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Coupon } from '@/types'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) {
    return NextResponse.json({ valid: false, error: 'No code provided' })
  }

  try {
    const supabase = createAdminClient()
    const { data: coupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single()

    if (!coupon) {
      return NextResponse.json({ valid: false, error: 'Coupon not found or expired' })
    }

    const c = coupon as Coupon
    if (c.expires_at && new Date(c.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: 'Coupon has expired' })
    }

    return NextResponse.json({ valid: true, type: c.type, value: c.value, code: c.code })
  } catch {
    return NextResponse.json({ valid: false, error: 'Could not validate coupon' })
  }
}
