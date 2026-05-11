import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import type { Supplier } from '@/types'

export const metadata = { title: 'Suppliers — Admin' }

const TERMS_LABEL: Record<string, string> = {
  prepaid: 'Prepaid',
  cash: 'Cash',
  net15: 'Net 15',
  net30: 'Net 30',
  net60: 'Net 60',
  other: 'Other',
}

export default async function AdminSuppliersPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('suppliers')
    .select('*')
    .order('is_active', { ascending: false })
    .order('name')

  const suppliers = (data ?? []) as Supplier[]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-charcoal">Suppliers</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Wholesalers and distributors you buy from.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/suppliers/new">
            <Plus className="h-4 w-4" /> Add Supplier
          </Link>
        </Button>
      </div>

      {suppliers.length === 0 ? (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-12 text-center">
          <div className="text-5xl mb-3">🏭</div>
          <p className="font-semibold text-brand-charcoal">No suppliers yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Add Restaurant Depot, Faire, or your specialty distributor to get started.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Email / Phone</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Terms</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/suppliers/${s.id}`}
                      className="font-medium text-brand-green hover:underline"
                    >
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {s.contact_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {s.email && <p>{s.email}</p>}
                    {s.phone && <p>{s.phone}</p>}
                    {!s.email && !s.phone && '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {TERMS_LABEL[s.payment_terms] ?? s.payment_terms}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-xs font-medium rounded-full px-2 py-0.5 ${
                        s.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {s.is_active ? 'Active' : 'Archived'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
