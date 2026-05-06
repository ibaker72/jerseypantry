import { NextRequest, NextResponse } from 'next/server'
import { requireAgentKey } from '@/lib/agent/auth'
import { SITE_URL } from '@/lib/seo/metadata'

// GET /api/agent — capability manifest for OpenClaw
export async function GET(req: NextRequest) {
  const deny = requireAgentKey(req)
  if (deny) return deny

  return NextResponse.json({
    name: 'My Corner Store Agent API',
    version: '1.0',
    base_url: `${SITE_URL}/api/agent`,
    endpoints: [
      {
        path: '/metrics',
        method: 'GET',
        description: 'Business snapshot: today revenue, week revenue, pending orders, low stock, B2B summary',
      },
      {
        path: '/alerts',
        method: 'GET',
        description: 'All actionable alerts: low stock (<5), stale orders, overdue B2B invoices, abandoned carts',
      },
      {
        path: '/orders',
        method: 'GET',
        params: ['status', 'limit', 'page'],
        description: 'List orders with optional status filter',
      },
      {
        path: '/orders/:id',
        method: 'GET',
        description: 'Get a single order with line items',
      },
      {
        path: '/orders/:id',
        method: 'PATCH',
        body: { status: 'string', note: 'string?' },
        description: 'Update order status or add admin note',
      },
      {
        path: '/inventory',
        method: 'GET',
        params: ['low_stock', 'category', 'limit'],
        description: 'List product stock levels',
      },
      {
        path: '/inventory',
        method: 'PATCH',
        body: { product_id: 'string', adjustment: 'number?', set_quantity: 'number?', reason: 'string?' },
        description: 'Adjust or set stock quantity for a product',
      },
      {
        path: '/notify',
        method: 'POST',
        body: { message: 'string', channel: 'string?', metadata: 'object?' },
        description: 'Send a notification through OpenClaw webhook',
      },
    ],
    auth: 'Bearer token — set AGENT_API_KEY env var and pass as Authorization: Bearer <key>',
  })
}
