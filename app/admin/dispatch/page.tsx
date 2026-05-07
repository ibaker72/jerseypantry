import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Truck } from 'lucide-react'
import { DispatcherView } from '@/components/admin/DispatcherView'
import type { DispatchOrder } from '@/types/wholesale'

export const metadata = { title: 'Dispatcher — Admin' }

export default async function DispatcherPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/dispatch')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  const { data: dispatches } = await supabase
    .from('dispatch_orders')
    .select(`
      *,
      orders (
        order_number,
        email,
        delivery_address,
        total
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  const pendingCount = (dispatches ?? []).filter((d: { status: string }) => d.status !== 'delivered').length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-charcoal flex items-center gap-2">
            <Truck className="w-6 h-6 text-brand-green" />
            Delivery Dispatcher
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage self-delivery runs and courier assignments · North Jersey
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full">
            {pendingCount} pending
          </span>
        )}
      </div>

      <DispatcherView initialDispatches={(dispatches ?? []) as DispatchOrder[]} />
    </div>
  )
}
