import { createAdminClient } from '@/lib/supabase/admin'
import type { OrderItem } from '@/types'

export async function sendB2BInviteEmail(params: {
  to: string
  business_name: string
  invite_token: string
  role: string
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const storeName = process.env.NEXT_PUBLIC_STORE_NAME ?? 'My Corner Store'
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'orders@mycornerstore.com'
  const acceptUrl = `${siteUrl}/b2b/accept-invite?token=${params.invite_token}`

  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#FAF8F3;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#1B4332;padding:32px 40px;">
      <h1 style="color:#fff;margin:0;font-size:24px;">${storeName}</h1>
      <p style="color:#a7f3d0;margin:8px 0 0;">You've been invited to a business account</p>
    </div>
    <div style="padding:32px 40px;">
      <p style="font-size:16px;color:#374151;">You've been invited to join <strong>${params.business_name}</strong> on ${storeName} as a <strong>${params.role}</strong>.</p>
      <div style="margin-top:32px;text-align:center;">
        <a href="${acceptUrl}" style="background:#1B4332;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">Accept Invitation →</a>
      </div>
      <p style="margin-top:24px;font-size:13px;color:#9ca3af;text-align:center;">This invite link expires in 7 days. If you didn't expect this, you can ignore this email.</p>
    </div>
  </div>
</body></html>`

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)
    await resend.emails.send({
      from: `${storeName} <${fromEmail}>`,
      to: params.to,
      subject: `You're invited to ${params.business_name} on ${storeName}`,
      html,
      text: `You've been invited to join ${params.business_name} on ${storeName}. Accept here: ${acceptUrl}`,
    })
  } catch (err) {
    console.error('Failed to send B2B invite email:', err)
  }
}

interface OrderConfirmationPayload {
  order_id: string
  order_number: string
  email: string
  items: OrderItem[]
  subtotal: number
  delivery_fee: number
  shipping_fee: number
  tax_amount: number
  discount_amount: number
  total: number
  fulfillment_method: string
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`
}

function buildOrderConfirmationHtml(payload: OrderConfirmationPayload): string {
  const {
    order_number,
    items,
    subtotal,
    delivery_fee,
    shipping_fee,
    tax_amount,
    discount_amount,
    total,
    fulfillment_method,
  } = payload

  const fulfillmentLabel =
    fulfillment_method === 'local_delivery'
      ? 'Local Delivery'
      : fulfillment_method === 'shipping'
      ? 'Standard Shipping'
      : 'Store Pickup'

  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;">${item.product_name ?? 'Item'}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${formatCurrency(item.line_total)}</td>
      </tr>`
    )
    .join('')

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Order Confirmation</title></head>
<body style="font-family:Arial,sans-serif;background:#FAF8F3;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:#1B4332;padding:32px 40px;">
      <h1 style="color:#fff;margin:0;font-size:24px;">My Corner Store</h1>
      <p style="color:#a7f3d0;margin:8px 0 0;">Order Confirmed!</p>
    </div>

    <!-- Body -->
    <div style="padding:32px 40px;">
      <p style="font-size:16px;color:#374151;">Thanks for your order. We've received it and are getting it ready.</p>

      <div style="background:#f3f4f6;border-radius:6px;padding:16px;margin:24px 0;">
        <p style="margin:0;font-size:14px;color:#6b7280;">Order Number</p>
        <p style="margin:4px 0 0;font-size:20px;font-weight:bold;color:#1B4332;">${order_number}</p>
      </div>

      <p style="font-size:14px;color:#6b7280;margin:0 0 4px;"><strong>Fulfillment:</strong> ${fulfillmentLabel}</p>

      <!-- Items -->
      <table style="width:100%;border-collapse:collapse;margin-top:24px;">
        <thead>
          <tr>
            <th style="text-align:left;padding-bottom:8px;border-bottom:2px solid #e5e7eb;font-size:13px;color:#6b7280;">Item</th>
            <th style="text-align:center;padding-bottom:8px;border-bottom:2px solid #e5e7eb;font-size:13px;color:#6b7280;">Qty</th>
            <th style="text-align:right;padding-bottom:8px;border-bottom:2px solid #e5e7eb;font-size:13px;color:#6b7280;">Total</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <!-- Totals -->
      <table style="width:100%;margin-top:16px;">
        <tr>
          <td style="padding:4px 0;color:#374151;">Subtotal</td>
          <td style="padding:4px 0;text-align:right;color:#374151;">${formatCurrency(subtotal)}</td>
        </tr>
        ${delivery_fee > 0 ? `<tr><td style="padding:4px 0;color:#374151;">Delivery Fee</td><td style="padding:4px 0;text-align:right;color:#374151;">${formatCurrency(delivery_fee)}</td></tr>` : ''}
        ${shipping_fee > 0 ? `<tr><td style="padding:4px 0;color:#374151;">Shipping</td><td style="padding:4px 0;text-align:right;color:#374151;">${formatCurrency(shipping_fee)}</td></tr>` : ''}
        ${tax_amount > 0 ? `<tr><td style="padding:4px 0;color:#374151;">Tax</td><td style="padding:4px 0;text-align:right;color:#374151;">${formatCurrency(tax_amount)}</td></tr>` : ''}
        ${discount_amount > 0 ? `<tr><td style="padding:4px 0;color:#E85D04;">Discount</td><td style="padding:4px 0;text-align:right;color:#E85D04;">-${formatCurrency(discount_amount)}</td></tr>` : ''}
        <tr>
          <td style="padding:12px 0 4px;font-weight:bold;font-size:16px;border-top:2px solid #e5e7eb;color:#111827;">Total</td>
          <td style="padding:12px 0 4px;text-align:right;font-weight:bold;font-size:16px;border-top:2px solid #e5e7eb;color:#1B4332;">${formatCurrency(total)}</td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:13px;color:#9ca3af;">Questions? Reply to this email or visit mycornerstore.com</p>
      <p style="margin:8px 0 0;font-size:12px;color:#d1d5db;">© ${new Date().getFullYear()} My Corner Store. North Jersey's Corner Store.</p>
    </div>
  </div>
</body>
</html>`
}

function buildOrderConfirmationText(payload: OrderConfirmationPayload): string {
  const { order_number, items, subtotal, delivery_fee, shipping_fee, tax_amount, discount_amount, total, fulfillment_method } = payload
  const fulfillmentLabel = fulfillment_method === 'local_delivery' ? 'Local Delivery' : fulfillment_method === 'shipping' ? 'Standard Shipping' : 'Store Pickup'

  const itemLines = items.map((i) => `  ${i.product_name} x${i.quantity} — ${formatCurrency(i.line_total)}`).join('\n')

  return [
    `MY CORNER STORE — Order Confirmed`,
    `Order: ${order_number}`,
    `Fulfillment: ${fulfillmentLabel}`,
    ``,
    `ITEMS`,
    itemLines,
    ``,
    `Subtotal: ${formatCurrency(subtotal)}`,
    delivery_fee > 0 ? `Delivery Fee: ${formatCurrency(delivery_fee)}` : null,
    shipping_fee > 0 ? `Shipping: ${formatCurrency(shipping_fee)}` : null,
    tax_amount > 0 ? `Tax: ${formatCurrency(tax_amount)}` : null,
    discount_amount > 0 ? `Discount: -${formatCurrency(discount_amount)}` : null,
    `TOTAL: ${formatCurrency(total)}`,
    ``,
    `Questions? Contact us at mycornerstore.com`,
  ]
    .filter((l) => l !== null)
    .join('\n')
}

export async function sendOrderConfirmationEmail(payload: OrderConfirmationPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — skipping confirmation email for', payload.order_number)
    return
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)

    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'orders@mycornerstore.com'

    const { data, error } = await resend.emails.send({
      from: `My Corner Store <${fromEmail}>`,
      to: payload.email,
      subject: `Order Confirmed — ${payload.order_number}`,
      html: buildOrderConfirmationHtml(payload),
      text: buildOrderConfirmationText(payload),
    })

    if (error) {
      console.error('Resend error:', error)
      return
    }

    // Log to DB (best-effort)
    try {
      const supabase = createAdminClient()
      await supabase.from('email_logs').insert({
        order_id: payload.order_id,
        to_email: payload.email,
        subject: `Order Confirmed — ${payload.order_number}`,
        type: 'order_confirmation',
        resend_id: data?.id ?? null,
      })
    } catch (logErr) {
      console.warn('Failed to log email to DB:', logErr)
    }
  } catch (err) {
    console.error('Failed to send confirmation email:', err)
  }
}

export async function sendAbandonedCartEmail(params: {
  email: string
  items: Array<{ name: string; quantity: number; retail_price: number }>
  cart_id: string
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const storeName = process.env.NEXT_PUBLIC_STORE_NAME ?? 'My Corner Store'
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'orders@mycornerstore.com'

  const itemRows = params.items
    .map((i) => `<tr><td style="padding:6px 0;border-bottom:1px solid #eee;">${i.name}</td><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right;">$${(i.retail_price * i.quantity).toFixed(2)}</td></tr>`)
    .join('')

  const subtotal = params.items.reduce((s, i) => s + i.retail_price * i.quantity, 0)

  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#FAF8F3;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#1B4332;padding:32px 40px;">
      <h1 style="color:#fff;margin:0;font-size:24px;">${storeName}</h1>
      <p style="color:#a7f3d0;margin:8px 0 0;">You left something behind!</p>
    </div>
    <div style="padding:32px 40px;">
      <p style="font-size:16px;color:#374151;">Hey there — you left some items in your cart. They're still waiting for you:</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        <thead><tr>
          <th style="text-align:left;padding-bottom:8px;border-bottom:2px solid #e5e7eb;font-size:13px;color:#6b7280;">Item</th>
          <th style="text-align:center;padding-bottom:8px;border-bottom:2px solid #e5e7eb;font-size:13px;color:#6b7280;">Qty</th>
          <th style="text-align:right;padding-bottom:8px;border-bottom:2px solid #e5e7eb;font-size:13px;color:#6b7280;">Total</th>
        </tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <table style="width:100%;margin-top:12px;">
        <tr><td style="font-weight:bold;font-size:16px;color:#111827;">Subtotal</td><td style="text-align:right;font-weight:bold;font-size:16px;color:#1B4332;">$${subtotal.toFixed(2)}</td></tr>
      </table>
      <div style="margin-top:32px;text-align:center;">
        <a href="${siteUrl}/cart" style="background:#1B4332;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">Complete Your Order →</a>
      </div>
      <p style="margin-top:24px;font-size:13px;color:#9ca3af;text-align:center;">Items are held while supplies last.</p>
    </div>
    <div style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:12px;color:#d1d5db;">© ${new Date().getFullYear()} ${storeName}. North Jersey's Corner Store.</p>
    </div>
  </div>
</body></html>`

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)
    await resend.emails.send({
      from: `${storeName} <${fromEmail}>`,
      to: params.email,
      subject: `You left something in your cart`,
      html,
      text: `You left items in your cart at ${storeName}. Complete your order: ${siteUrl}/cart`,
    })
  } catch (err) {
    console.error('Failed to send abandoned cart email:', err)
  }
}

// ============================================================
// OpenClaw — B2B follow-up emails
// ============================================================

export async function sendFollowupEmail(params: {
  to: string
  business_name: string
  contact_name: string | null
  follow_up_count: number
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  const storeName = process.env.NEXT_PUBLIC_STORE_NAME ?? 'My Corner Store'
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'orders@mycornerstore.com'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const firstName = params.contact_name?.split(' ')[0] ?? 'there'

  const dayLabels: Record<number, string> = { 0: '3-day', 1: '7-day', 2: '14-day' }
  const dayLabel = dayLabels[params.follow_up_count] ?? 'follow-up'

  const subjects: Record<number, string> = {
    0: `Office snack & drink delivery for ${params.business_name}`,
    1: `Quick follow-up — ${storeName}`,
    2: `Last check-in — office supply delivery`,
  }

  const bodies: Record<number, string> = {
    0: `Hi ${firstName},\n\nI wanted to follow up on my earlier note about My Corner Store's Office Refill service.\n\nWe deliver snacks, drinks, and office essentials directly to businesses across North Jersey — weekly or bi-weekly, no minimums to get started.\n\nWould a quick 10-minute call work this week? Happy to walk you through what we stock and what a plan could look like for ${params.business_name}.\n\nBest,\nMy Corner Store Team`,
    1: `Hi ${firstName},\n\nJust checking back in — we're still available to get ${params.business_name} set up with office snack & drink delivery.\n\nOur Starter plan is $99/month and covers weekly delivery. Most offices are up and running within a week of signing up.\n\nInterested? You can start at ${siteUrl}/office-refill or just reply here.\n\nBest,\nMy Corner Store Team`,
    2: `Hi ${firstName},\n\nThis is my last follow-up — I don't want to fill your inbox. If the timing isn't right for ${params.business_name}, no worries at all.\n\nIf it ever makes sense to revisit snack & drink delivery for your team, we're always at ${siteUrl}/office-refill.\n\nThanks for your time,\nMy Corner Store Team`,
  }

  const subject = subjects[params.follow_up_count] ?? subjects[2]
  const body = bodies[params.follow_up_count] ?? bodies[2]

  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#FAF8F3;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#1B4332;padding:28px 40px;">
      <h1 style="color:#fff;margin:0;font-size:22px;">${storeName}</h1>
      <p style="color:#a7f3d0;margin:6px 0 0;font-size:13px;">Office Refill — North Jersey</p>
    </div>
    <div style="padding:32px 40px;">
      ${body.replace(/\n/g, '<br>')}
    </div>
    <div style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:12px;color:#d1d5db;">© ${new Date().getFullYear()} ${storeName}. You received this because someone at your company expressed interest in our Office Refill program.</p>
    </div>
  </div>
</body></html>`

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)
    await resend.emails.send({
      from: `${storeName} <${fromEmail}>`,
      to: params.to,
      subject: `${subject} (${dayLabel} follow-up)`,
      html,
      text: body,
    })
  } catch (err) {
    console.error(`[OpenClaw] Failed to send ${dayLabel} follow-up to ${params.to}:`, err)
  }
}

export async function sendOrderStatusUpdateEmail(params: {
  order_id: string
  order_number: string
  email: string
  new_status: string
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  const statusMessages: Record<string, { subject: string; body: string }> = {
    processing: {
      subject: `Your order ${params.order_number} is being processed`,
      body: `Great news! We're preparing your order ${params.order_number} now.`,
    },
    out_for_delivery: {
      subject: `Your order ${params.order_number} is out for delivery!`,
      body: `Your order ${params.order_number} is on its way to you today.`,
    },
    delivered: {
      subject: `Your order ${params.order_number} has been delivered`,
      body: `Your order ${params.order_number} has been delivered. Enjoy!`,
    },
    ready_for_pickup: {
      subject: `Your order ${params.order_number} is ready for pickup`,
      body: `Your order ${params.order_number} is ready to be picked up at the store.`,
    },
    canceled: {
      subject: `Your order ${params.order_number} has been canceled`,
      body: `Your order ${params.order_number} has been canceled. If you have questions, please contact us.`,
    },
  }

  const msg = statusMessages[params.new_status]
  if (!msg) return

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'orders@mycornerstore.com'

    await resend.emails.send({
      from: `My Corner Store <${fromEmail}>`,
      to: params.email,
      subject: msg.subject,
      html: `<p style="font-family:Arial,sans-serif;">${msg.body}</p><p style="font-family:Arial,sans-serif;color:#6b7280;font-size:13px;">— My Corner Store Team</p>`,
      text: msg.body,
    })

    const supabase = createAdminClient()
    await supabase.from('email_logs').insert({
      order_id: params.order_id,
      to_email: params.email,
      subject: msg.subject,
      type: 'status_update',
    })
  } catch (err) {
    console.error('Failed to send status update email:', err)
  }
}
