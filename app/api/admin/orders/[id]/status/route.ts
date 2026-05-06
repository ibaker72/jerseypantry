import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendOrderStatusUpdateEmail } from '@/lib/email/resend'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { status } = body

  if (!status || typeof status !== 'string') {
    return NextResponse.json({ error: 'status is required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: order, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select('id, order_number, email, status')
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }

  // Send status update email (non-blocking)
  sendOrderStatusUpdateEmail({
    order_id: order.id,
    order_number: order.order_number,
    email: order.email,
    new_status: status,
  }).catch((e) => console.warn('Status email failed:', e))

  return NextResponse.json({ ok: true })
}
