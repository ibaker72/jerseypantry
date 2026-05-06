import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AddressManager } from './AddressManager'
import type { Address, Customer } from '@/types'

export const metadata = { title: 'Saved Addresses — My Corner Store' }

export default async function AddressesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/account/addresses')

  // Get or create customer record for this user
  let { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!customer) {
    const { data: newCustomer } = await supabase
      .from('customers')
      .insert({ user_id: user.id, email: user.email! })
      .select('id')
      .single()
    customer = newCustomer
  }

  const { data: addresses } = customer
    ? await supabase.from('addresses').select('*').eq('customer_id', customer.id).order('created_at', { ascending: false })
    : { data: [] }

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
      <h2 className="font-semibold text-brand-charcoal mb-5">Saved Addresses</h2>
      <AddressManager
        addresses={(addresses ?? []) as Address[]}
        customerId={(customer as Customer | null)?.id ?? ''}
      />
    </div>
  )
}
