/**
 * Abandoned Cart Recovery Edge Function
 *
 * Scheduled to run every hour via pg_cron or Supabase Dashboard → Scheduled Functions.
 * Finds saved_carts that are 1–24 hours old and have not resulted in a paid order,
 * then sends a recovery email via Resend.
 *
 * Setup in Supabase Dashboard:
 *   Functions → New Function → Cron Schedule: "0 * * * *" (every hour)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL    = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY  = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL      = Deno.env.get('RESEND_FROM_EMAIL') ?? 'orders@mycornerstore.com'
const SITE_URL        = Deno.env.get('NEXT_PUBLIC_SITE_URL') ?? 'https://mycornerstore.com'

Deno.serve(async () => {
  if (!RESEND_API_KEY) {
    console.log('RESEND_API_KEY not set — skipping abandoned cart emails')
    return new Response('ok', { status: 200 })
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

  // Find carts updated 1–24 hours ago (in the abandoned window)
  const oneHourAgo   = new Date(Date.now() - 1  * 60 * 60 * 1000).toISOString()
  const twentyFourAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: carts, error } = await supabase
    .from('saved_carts')
    .select('*')
    .lte('updated_at', oneHourAgo)
    .gte('updated_at', twentyFourAgo)

  if (error) {
    console.error('Failed to fetch saved carts:', error)
    return new Response('error', { status: 500 })
  }

  console.log(`Processing ${(carts ?? []).length} abandoned carts`)

  let sent = 0
  for (const cart of carts ?? []) {
    try {
      // Check if a paid order exists for this email after cart was saved
      const { data: paidOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('email', cart.email)
        .eq('status', 'paid')
        .gte('created_at', cart.updated_at)
        .single()

      if (paidOrder) {
        // Order already placed — clean up cart record
        await supabase.from('saved_carts').delete().eq('id', cart.id)
        continue
      }

      const items: Array<{ name: string; quantity: number; retail_price: number }> = cart.items ?? []
      const subtotal = items.reduce((sum: number, i) => sum + i.retail_price * i.quantity, 0)

      const itemList = items
        .map((i) => `<li>${i.name} × ${i.quantity} — $${(i.retail_price * i.quantity).toFixed(2)}</li>`)
        .join('')

      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#FAF8F3;padding:20px;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
    <div style="background:#1B4332;padding:28px 36px;">
      <h1 style="color:#fff;margin:0;font-size:22px;">My Corner Store</h1>
      <p style="color:#a7f3d0;margin:6px 0 0;font-size:14px;">You left something behind!</p>
    </div>
    <div style="padding:28px 36px;">
      <p style="color:#374151;">Hey there! You've got items in your cart. They're going fast — grab them before they're gone.</p>
      <ul style="padding-left:20px;color:#374151;line-height:2;">${itemList}</ul>
      <p style="font-weight:bold;color:#1B4332;font-size:18px;">Subtotal: $${subtotal.toFixed(2)}</p>
      <a href="${SITE_URL}/cart" style="display:inline-block;margin-top:16px;background:#E85D04;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">
        Complete Your Order →
      </a>
      <p style="margin-top:20px;font-size:13px;color:#6b7280;">Use code <strong>CORNER10</strong> for 10% off your first order!</p>
    </div>
    <div style="background:#f9fafb;padding:20px 36px;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="font-size:12px;color:#9ca3af;margin:0;">© ${new Date().getFullYear()} My Corner Store · North Jersey's Corner Store</p>
    </div>
  </div>
</body>
</html>`

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: `My Corner Store <${FROM_EMAIL}>`,
          to: cart.email,
          subject: "You left something in your cart 🛒",
          html,
        }),
      })

      if (res.ok) {
        sent++
        // Mark cart as emailed by updating timestamp far in the past so it won't re-trigger
        await supabase.from('saved_carts').update({ updated_at: new Date(0).toISOString() }).eq('id', cart.id)
        console.log(`Sent abandoned cart email to ${cart.email}`)
      } else {
        console.error(`Failed to send to ${cart.email}:`, await res.text())
      }
    } catch (err) {
      console.error(`Error processing cart ${cart.id}:`, err)
    }
  }

  return new Response(JSON.stringify({ processed: (carts ?? []).length, sent }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
