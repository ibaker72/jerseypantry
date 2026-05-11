import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendStockRequestDigestEmail } from '@/lib/email/resend'

// Weekly digest of top stock requests. Configure via vercel.json cron.
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = createAdminClient()

  // Top open requests (new + reviewing), ranked by demand.
  const { data: items, error } = await supabase
    .from('stock_requests')
    .select('product_name, brand, size, request_count, email, notes, created_at, status')
    .in('status', ['new', 'reviewing'])
    .order('request_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('stock-requests-digest cron error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { count } = await supabase
    .from('stock_requests')
    .select('*', { count: 'exact', head: true })
    .in('status', ['new', 'reviewing'])

  const result = await sendStockRequestDigestEmail({
    items: items ?? [],
    total_open: count ?? items?.length ?? 0,
  })

  return NextResponse.json({
    sent: result.sent,
    items_in_digest: items?.length ?? 0,
    total_open: count ?? 0,
  })
}

export const GET = POST
