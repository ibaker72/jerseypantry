import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export function getAgentKey() {
  return process.env.AGENT_API_KEY ?? ''
}

export function requireAgentKey(req: NextRequest): NextResponse | null {
  const key = getAgentKey()
  if (!key) {
    return NextResponse.json({ error: 'Agent API not configured' }, { status: 503 })
  }
  const auth = req.headers.get('authorization') ?? ''
  const provided = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (provided !== key) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

export function agentSupabase() {
  return createAdminClient()
}
