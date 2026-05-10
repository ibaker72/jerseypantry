import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { PlanBasketEditor } from './PlanBasketEditor'
import type { B2BPlan, B2BPlanItem } from '@/types'

const VALID = new Set<B2BPlan>(['starter', 'standard', 'premium'])

const LABELS: Record<B2BPlan, string> = {
  starter: 'Starter ($99/mo)',
  standard: 'Standard ($199/mo)',
  premium: 'Premium ($399/mo)',
}

interface Props { params: Promise<{ plan: string }> }

export async function generateMetadata({ params }: Props) {
  const { plan } = await params
  return { title: `${plan} Plan Basket — Admin` }
}

export default async function PlanBasketPage({ params }: Props) {
  const { plan } = await params
  if (!VALID.has(plan as B2BPlan)) notFound()
  const planKey = plan as B2BPlan

  const supabase = createAdminClient()
  const [{ data: items }, { data: products }] = await Promise.all([
    supabase
      .from('b2b_plan_items')
      .select('*, product:products(id, name, retail_price, sku)')
      .eq('plan_name', planKey)
      .order('sort_order'),
    supabase
      .from('products')
      .select('id, name, retail_price, sku')
      .eq('is_active', true)
      .order('name'),
  ])

  return (
    <div className="space-y-6">
      <Link
        href="/admin/b2b/plans"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-charcoal"
      >
        <ArrowLeft className="h-4 w-4" /> Back to plan baskets
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-brand-charcoal">{LABELS[planKey]} basket</h1>
        <p className="text-sm text-gray-500 mt-1">
          Items in this list are included in every recurring delivery for accounts on the {planKey} plan.
        </p>
      </div>

      <PlanBasketEditor
        plan={planKey}
        items={(items ?? []) as B2BPlanItem[]}
        allProducts={products ?? []}
      />
    </div>
  )
}
