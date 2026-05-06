import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

const leadSchema = z.object({
  business_name: z.string().min(1),
  contact_name: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  business_type: z.string().optional(),
  estimated_budget: z.string().optional(),
  message: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = leadSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase.from('office_refill_leads').insert(parsed.data)

    if (error) {
      console.error('Failed to save lead:', error)
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }

    // TODO: Send notification email via Resend when RESEND_API_KEY is set

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Office refill lead error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
