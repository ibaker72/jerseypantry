import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendAbandonedCartEmail } from '@/lib/email/resend'
import type { CartItem } from '@/types'

// Called by a cron job (e.g. Vercel Cron, Supabase pg_cron, or external scheduler)
// every 15 min.  Set CRON_SECRET env var and send it as Bearer token.
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = createAdminClient()
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
  const oneDayAgo        = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // Find carts updated 30 min–24 h ago with no recovery email sent yet
  const { data: carts, error } = await supabase
    .from('saved_carts')
    .select('id, email, items, updated_at')
    .lt('updated_at', thirtyMinutesAgo)
    .gt('updated_at', oneDayAgo)
    .is('recovery_email_sent_at', null)
    .not('items', 'eq', '[]')
    .limit(50)

  if (error) {
    console.error('abandoned-cart cron error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let sent = 0
  for (const cart of carts ?? []) {
    // Skip if the cart owner has a completed order placed after the cart was saved
    const { data: recentOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('email', cart.email)
      .in('status', ['paid', 'preparing', 'out_for_delivery', 'completed'])
      .gte('created_at', cart.updated_at)
      .limit(1)
      .single()

    if (recentOrder) continue

    const items = (cart.items as CartItem[]).map((i) => ({
      name: i.name,
      quantity: i.quantity,
      retail_price: i.retail_price,
    }))

    await sendAbandonedCartEmail({ email: cart.email, items, cart_id: cart.id })

    await supabase
      .from('saved_carts')
      .update({ recovery_email_sent_at: new Date().toISOString() })
      .eq('id', cart.id)

    sent++
  }

  return NextResponse.json({ processed: carts?.length ?? 0, sent })
}
