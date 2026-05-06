import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { Calendar } from 'lucide-react'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const FREQ_LABELS: Record<string, string> = {
  weekly: 'Every week',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
}

export default async function B2BSchedulePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/b2b/schedule')

  const admin = createAdminClient()

  const { data: member } = await admin
    .from('business_members')
    .select('business_id')
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null)
    .single()

  if (!member) redirect('/office-refill?no_account=1')

  const { data: schedules } = await admin
    .from('delivery_schedules')
    .select('*')
    .eq('business_id', member.business_id)
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-charcoal">Delivery Schedule</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your recurring delivery windows set by your account manager.
        </p>
      </div>

      {!schedules || schedules.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-600">No delivery schedule yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Contact your account manager to set up recurring deliveries.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {schedules.map((s) => (
            <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-brand-green" />
                    <p className="font-semibold text-brand-charcoal">
                      {FREQ_LABELS[s.frequency] ?? s.frequency}
                      {s.day_of_week !== null ? ` on ${DAY_NAMES[s.day_of_week]}s` : ''}
                    </p>
                  </div>
                  {s.time_window && (
                    <p className="text-sm text-gray-500 mt-1 ml-7">{s.time_window}</p>
                  )}
                  {s.notes && (
                    <p className="text-sm text-gray-400 mt-1 ml-7 italic">{s.notes}</p>
                  )}
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  s.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                }`}>
                  {s.is_active ? 'Active' : 'Paused'}
                </span>
              </div>

              {s.next_delivery_at && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                  <span className="text-gray-500">Next delivery</span>
                  <span className="font-medium text-brand-charcoal">
                    {new Date(s.next_delivery_at).toLocaleDateString('en-US', {
                      weekday: 'long', month: 'long', day: 'numeric',
                    })}
                  </span>
                </div>
              )}
              {s.last_delivery_at && (
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-gray-400">Last delivery</span>
                  <span className="text-gray-500">
                    {new Date(s.last_delivery_at).toLocaleDateString('en-US', {
                      month: 'long', day: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        To modify your delivery schedule, please contact{' '}
        <a href="mailto:hello@mycornerstore.com" className="underline">hello@mycornerstore.com</a>.
      </p>
    </div>
  )
}
