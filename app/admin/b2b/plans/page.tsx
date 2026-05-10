import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { Boxes, ChevronRight } from 'lucide-react'
import type { B2BPlan, B2BPlanItem } from '@/types'

type PlanItemWithProduct = Omit<B2BPlanItem, 'product'> & {
  product: { id: string; name: string; retail_price: number; sku: string | null } | null
}

export const metadata = { title: 'B2B Plan Baskets — Admin' }

const PLANS: { key: B2BPlan; label: string; price: string }[] = [
  { key: 'starter', label: 'Starter', price: '$99/mo' },
  { key: 'standard', label: 'Standard', price: '$199/mo' },
  { key: 'premium', label: 'Premium', price: '$399/mo' },
]

export default async function B2BPlansPage() {
  const supabase = createAdminClient()
  const { data: items } = await supabase
    .from('b2b_plan_items')
    .select('*, product:products(id, name, retail_price, sku)')
    .order('plan_name')
    .order('sort_order')

  const all = (items ?? []) as unknown as PlanItemWithProduct[]
  const byPlan: Record<B2BPlan, PlanItemWithProduct[]> = {
    starter: all.filter((i) => i.plan_name === 'starter'),
    standard: all.filter((i) => i.plan_name === 'standard'),
    premium: all.filter((i) => i.plan_name === 'premium'),
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-charcoal flex items-center gap-2">
          <Boxes className="h-6 w-6 text-brand-green" /> B2B Plan Baskets
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Curate the products and quantities included in each Office Refill plan tier. The recurring delivery cron
          generates orders from these baskets.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {PLANS.map(({ key, label, price }) => {
          const items = byPlan[key]
          const lineCount = items.length
          const unitCount = items.reduce((s, i) => s + i.quantity, 0)
          const cogs = items.reduce((s, i) => s + i.quantity * (i.product?.retail_price ?? 0), 0)

          return (
            <Link
              key={key}
              href={`/admin/b2b/plans/${key}`}
              className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 hover:border-brand-green/40 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-brand-charcoal">{label}</p>
                  <p className="text-xs text-gray-400">{price}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-brand-green" />
              </div>

              <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-gray-50 p-2">
                  <dt className="text-[10px] text-gray-400 uppercase">Lines</dt>
                  <dd className="text-lg font-bold text-brand-charcoal">{lineCount}</dd>
                </div>
                <div className="rounded-lg bg-gray-50 p-2">
                  <dt className="text-[10px] text-gray-400 uppercase">Units</dt>
                  <dd className="text-lg font-bold text-brand-charcoal">{unitCount}</dd>
                </div>
                <div className="rounded-lg bg-gray-50 p-2">
                  <dt className="text-[10px] text-gray-400 uppercase">Retail</dt>
                  <dd className="text-lg font-bold text-brand-charcoal">${cogs.toFixed(0)}</dd>
                </div>
              </dl>

              {items.length === 0 && (
                <p className="mt-3 text-xs text-amber-600">No items configured — add products to enable this plan.</p>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
