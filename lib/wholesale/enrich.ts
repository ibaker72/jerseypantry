import { createClient } from '@/lib/supabase/server'
import type { Product, WholesaleDisplay, VelocityVerdict } from '@/types'

/**
 * Fetch a verdict map for a list of product IDs. One RPC call per page —
 * the underlying function returns the whole catalog's verdicts.
 */
async function fetchVerdictMap(): Promise<Record<string, VelocityVerdict>> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_product_velocity')
  if (error || !data) return {}
  return Object.fromEntries(
    (data as { product_id: string; recommendation: VelocityVerdict }[])
      .map((r) => [r.product_id, r.recommendation])
  )
}

/**
 * For each product that has a wholesale_price, build the WholesaleDisplay
 * payload for the card. Products without a wholesale_price get null
 * (ProductCard falls back to retail rendering for those).
 */
export async function buildWholesaleMap(
  products: Pick<Product, 'id' | 'wholesale_price' | 'case_size' | 'wholesale_unit'>[]
): Promise<Record<string, WholesaleDisplay | null>> {
  const verdicts = await fetchVerdictMap()
  const map: Record<string, WholesaleDisplay | null> = {}
  for (const p of products) {
    if (p.wholesale_price && p.wholesale_price > 0) {
      map[p.id] = {
        wholesale_price: Number(p.wholesale_price),
        case_size: Number(p.case_size ?? 12),
        wholesale_unit: p.wholesale_unit ?? null,
        verdict: verdicts[p.id] ?? null,
      }
    } else {
      map[p.id] = null
    }
  }
  return map
}
