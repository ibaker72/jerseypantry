import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils/format'
import type { DeliveryZone } from '@/types'

export const metadata = { title: 'Delivery Zones — Admin' }

export default async function DeliveryZonesPage() {
  const supabase = await createClient()
  const { data: zones } = await supabase
    .from('delivery_zones')
    .select('*')
    .order('city')
    .order('postal_code')

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-charcoal mb-6">Delivery Zones</h1>
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">City</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">ZIP Code</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Delivery Fee</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Free Delivery Min.</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(zones as DeliveryZone[] ?? []).map((zone) => (
              <tr key={zone.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-brand-charcoal">{zone.city ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-gray-500">{zone.postal_code}</td>
                <td className="px-4 py-3 text-right">{formatPrice(zone.delivery_fee)}</td>
                <td className="px-4 py-3 text-right text-gray-500">{formatPrice(zone.free_delivery_minimum)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block h-2 w-2 rounded-full ${zone.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-4">
        To add or edit zones, run a SQL migration or update via Supabase dashboard.
        {/* TODO: Add zone management UI in a future iteration */}
      </p>
    </div>
  )
}
