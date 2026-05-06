import { createClient } from '@/lib/supabase/server'
import type { OfficeRefillLead } from '@/types'

export const metadata = { title: 'Office Refill Leads — Admin' }

export default async function OfficeRefillLeadsPage() {
  const supabase = await createClient()
  const { data: leads } = await supabase
    .from('office_refill_leads')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-charcoal mb-6">Office Refill Leads</h1>
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Business</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Budget</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(leads as OfficeRefillLead[] ?? []).length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">No leads yet.</td>
                </tr>
              )}
              {(leads as OfficeRefillLead[] ?? []).map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-brand-charcoal">{lead.business_name}</td>
                  <td className="px-4 py-3 text-gray-600">{lead.contact_name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{lead.email}</td>
                  <td className="px-4 py-3 text-gray-500">{lead.business_type ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{lead.estimated_budget?.replace('_', '-$') ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${lead.status === 'new' ? 'bg-brand-orange/10 text-brand-orange' : 'bg-gray-100 text-gray-600'}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
