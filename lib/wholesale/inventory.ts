import { createAdminClient } from '@/lib/supabase/admin'
import type { AvailabilityStatus, WholesaleProduct, ReserveStockResult } from '@/types/wholesale'

// ── Buffer Calculation ────────────────────────────────────────────────────────

export function applyBuffer(wholesaler_stock: number, buffer_pct: number): number {
  return Math.floor(wholesaler_stock * (1 - buffer_pct))
}

export function getAvailabilityStatus(available: number): AvailabilityStatus {
  if (available <= 0) return 'unavailable'
  if (available <= 3) return 'limited'
  return 'same_day_pickup'
}

// ── Load Wholesale Catalog for a Business ────────────────────────────────────

export async function getWholesaleCatalog(business_id: string): Promise<WholesaleProduct[]> {
  const admin = createAdminClient()

  const { data: catalogItems, error } = await admin
    .from('business_catalogs')
    .select(`
      custom_price,
      is_active,
      products (
        id, name, slug, price, image_url, category, sku
      )
    `)
    .eq('business_id', business_id)
    .eq('is_active', true)

  if (error || !catalogItems) return []

  const productIds = catalogItems
    .map((i) => (i.products as unknown as { id: string } | null)?.id)
    .filter(Boolean) as string[]

  const { data: wiRecords } = await admin
    .from('wholesale_inventory')
    .select('*')
    .in('product_id', productIds)

  const wiMap = new Map(
    (wiRecords ?? []).map((w) => [w.product_id, w])
  )

  return catalogItems
    .map((item) => {
      const product = item.products as unknown as {
        id: string; name: string; slug: string; price: number
        image_url: string | null; category: string; sku: string | null
      } | null

      if (!product) return null

      const wi = wiMap.get(product.id)
      const available = wi ? applyBuffer(wi.wholesaler_stock, wi.buffer_pct) : 0
      const availability_status: AvailabilityStatus = wi?.last_verified_at
        ? getAvailabilityStatus(available)
        : 'wholesale_verified'

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        image_url: product.image_url,
        category: product.category,
        sku: product.sku,
        wholesale_unit: wi?.wholesale_unit ?? 'Unit',
        unit_count: wi?.unit_count ?? 1,
        wholesale_price: item.custom_price ?? product.price,
        market_price: product.price,
        custom_price: item.custom_price,
        weight_lbs: wi?.weight_lbs ?? 0,
        volume_cubic_ft: wi?.volume_cubic_ft ?? 0,
        availability_status,
        available_quantity: available,
      } satisfies WholesaleProduct
    })
    .filter(Boolean) as WholesaleProduct[]
}

// ── Reserve Stock (calls Supabase RPC) ───────────────────────────────────────

export async function reserveWholesaleStock(
  product_id: string,
  quantity: number,
  order_id?: string
): Promise<ReserveStockResult> {
  const admin = createAdminClient()

  const { data, error } = await admin.rpc('reserve_wholesale_stock', {
    p_product_id: product_id,
    p_quantity: quantity,
    p_order_id: order_id ?? null,
  })

  if (error) return { success: false, error: error.message }

  return data as ReserveStockResult
}
