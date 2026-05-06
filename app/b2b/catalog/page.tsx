import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { formatPrice } from "@/lib/utils/format"
import { Tag } from 'lucide-react'

export default async function B2BCatalogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/b2b/catalog')

  const admin = createAdminClient()

  const { data: member } = await admin
    .from('business_members')
    .select('business_id')
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null)
    .single()

  if (!member) redirect('/office-refill?no_account=1')

  const { data: catalogItems } = await admin
    .from('business_catalogs')
    .select('*, products(id, name, slug, price, image_url, category)')
    .eq('business_id', member.business_id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  const categories = Array.from(
    new Set((catalogItems ?? []).map((i) => (i.products as any)?.category).filter(Boolean))
  ).sort() as string[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-charcoal">My Catalog</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your curated product list with negotiated pricing.
        </p>
      </div>

      {!catalogItems || catalogItems.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Tag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-600">No catalog items yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Your account manager will set up your personalized catalog.
          </p>
        </div>
      ) : (
        categories.map((cat) => {
          const items = (catalogItems ?? []).filter(
            (i) => (i.products as any)?.category === cat
          )
          return (
            <div key={cat}>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">{cat}</h2>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                {items.map((item) => {
                  const product = item.products as any
                  const displayPrice = item.custom_price ?? product?.price ?? 0
                  const hasDiscount = item.custom_price !== null && item.custom_price < (product?.price ?? 0)
                  return (
                    <div key={item.id} className="flex items-center gap-4 px-4 py-3">
                      {product?.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          width={48}
                          height={48}
                          className="rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-brand-charcoal text-sm">{product?.name}</p>
                        <p className="text-xs text-gray-400 capitalize">{product?.category}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-brand-charcoal">{formatPrice(displayPrice)}</p>
                        {hasDiscount && (
                          <p className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</p>
                        )}
                        {hasDiscount && (
                          <span className="text-xs text-brand-green font-medium">Contract price</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
