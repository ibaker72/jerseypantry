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
      {
        path: '/leads',
        method: 'GET',
        params: ['status', 'source', 'search', 'limit', 'page'],
        description: 'List sales leads with outreach history; filter by status, source, or search term',
      },
      {
        path: '/leads',
        method: 'POST',
        body: { business_name: 'string', email: 'string', contact_name: 'string?', phone: 'string?', business_type: 'string?', estimated_budget: 'string?', lead_source: 'string?', city: 'string?', state: 'string?', website: 'string?', notes: 'string?', agent_notes: 'string?' },
        description: 'Create agent-prospected lead; deduplicates by email (409 if exists)',
      },
      {
        path: '/leads/:id',
        method: 'GET',
        description: 'Full lead detail with all outreach log entries and linked business account if converted',
      },
      {
        path: '/leads/:id',
        method: 'PATCH',
        body: { status: 'string?', notes: 'string?', agent_notes: 'string?', contact_name: 'string?', phone: 'string?', website: 'string?', estimated_budget: 'string?', business_type: 'string?' },
        description: 'Update lead fields; status can only advance forward in pipeline',
      },
      {
        path: '/outreach',
        method: 'POST',
        body: { lead_id: 'string', type: 'initial_outreach|follow_up', plan_suggestion: 'starter|standard|premium?', custom_hook: 'string?', sent_by: 'agent|human?' },
        description: 'Send outreach email, log to outreach_log, advance lead status new→contacted',
      },
      {
        path: '/outreach',
        method: 'GET',
        params: ['lead_id'],
        description: 'Get full outreach history for a lead',
      },
    ],
    auth: 'Bearer token — set AGENT_API_KEY env var and pass as Authorization: Bearer <key>',
  })
}
