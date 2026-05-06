import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin() {
  const serverClient = await createClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) return null
  const supabase = createAdminClient()
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? supabase : null
}

function nextDeliveryDate(frequency: string, dayOfWeek: number): Date {
  const now = new Date()
  const d = new Date(now)
  // Find next occurrence of dayOfWeek
  const daysUntil = (dayOfWeek - d.getDay() + 7) % 7 || 7
  d.setDate(d.getDate() + daysUntil)
  if (frequency === 'biweekly') {
    // Already set to next occurrence; biweekly just means every 2 weeks from that
  }
  return d
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await requireAdmin()
  if (!supabase) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { frequency, day_of_week, time_window, notes } = body

  const nextDelivery = nextDeliveryDate(frequency, day_of_week ?? 1)

  const { data: schedule, error } = await supabase
    .from('delivery_schedules')
    .insert({
      business_id: id,
      frequency,
      day_of_week: day_of_week ?? null,
      time_window: time_window || null,
      notes: notes || null,
      next_delivery_at: nextDelivery.toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ schedule }, { status: 201 })
}
