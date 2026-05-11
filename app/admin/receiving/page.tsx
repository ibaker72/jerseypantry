import Link from 'next/link'
import { Clock, ScanLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { startReceivingSession } from '@/lib/actions/receiving'
import type { ReceivingSession, Supplier } from '@/types'

export const metadata = { title: 'Receiving — Admin' }

export default async function ReceivingStartPage() {
  const supabase = await createClient()

  const [{ data: openSession }, { data: suppliers }] = await Promise.all([
    supabase
      .from('receiving_sessions')
      .select('*, supplier:suppliers(id, name)')
      .eq('status', 'open')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('suppliers')
      .select('id, name')
      .eq('is_active', true)
      .order('name'),
  ])

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-charcoal flex items-center gap-2">
            <ScanLine className="h-6 w-6 text-brand-green" /> Receiving
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Start a session, scan items as they come off the truck.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/receiving/history">
            <Clock className="h-4 w-4" /> Past sessions
          </Link>
        </Button>
      </div>

      {openSession && (
        <div className="rounded-2xl bg-brand-orange/10 border border-brand-orange/30 p-4 mb-6">
          <p className="text-sm text-brand-charcoal mb-2">
            <strong>Open session</strong> started{' '}
            {new Date((openSession as ReceivingSession).started_at).toLocaleString()}
            {(openSession as ReceivingSession & { supplier?: Pick<Supplier, 'name'> | null })
              .supplier
              ? ` · ${(openSession as ReceivingSession & { supplier?: Pick<Supplier, 'name'> | null })
                  .supplier!.name}`
              : ''}
          </p>
          <Button asChild>
            <Link href={`/admin/receiving/${(openSession as ReceivingSession).id}`}>
              Resume session →
            </Link>
          </Button>
        </div>
      )}

      <form action={startReceivingSession} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-brand-charcoal border-b pb-3">
          Start new session
        </h2>
        <div className="space-y-1.5">
          <label htmlFor="rs-supplier" className="text-sm font-medium text-gray-700">
            Supplier
          </label>
          <select
            id="rs-supplier"
            name="supplier_id"
            className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
            defaultValue=""
          >
            <option value="">— No specific supplier —</option>
            {(suppliers ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400">
            Every lot in this session inherits this supplier.{' '}
            <Link href="/admin/suppliers/new" className="underline">
              Add a new one
            </Link>
            .
          </p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="rs-notes" className="text-sm font-medium text-gray-700">
            Notes (optional)
          </label>
          <input
            id="rs-notes"
            name="notes"
            type="text"
            placeholder="e.g. Restaurant Depot Paterson run"
            className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
          />
        </div>
        <Button type="submit" size="lg">
          <ScanLine className="h-4 w-4" /> Start receiving
        </Button>
      </form>
    </div>
  )
}
