import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { slugify } from '@/lib/utils/format'
import type { ProductImportRow } from '@/lib/validators/cart'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { rows, category_map }: { rows: ProductImportRow[]; category_map: Record<string, string> } = body

    if (!rows?.length) {
      return NextResponse.json({ error: 'No rows provided' }, { status: 400 })
    }

    const supabase = createAdminClient()
    let success = 0
    let errors = 0

    for (const row of rows) {
      try {
        const categoryId = category_map[row.category.toLowerCase()] ?? null

        const payload = {
          name: row.name,
          slug: slugify(row.name),
          sku: row.sku,
          description: row.description || null,
          image_url: row.image_url || null,
          barcode: row.barcode || null,
          brand: row.brand || null,
          size: row.size || null,
          unit: row.unit || null,
          wholesale_cost: row.wholesale_cost,
          retail_price: row.retail_price,
          inventory_quantity: row.inventory_quantity,
          reorder_threshold: row.reorder_threshold ?? 5,
          shipping_eligible: row.shipping_eligible ?? true,
          delivery_eligible: row.delivery_eligible ?? true,
          category_id: categoryId,
          is_active: true,
        }

        const { error } = await supabase
          .from('products')
          .upsert(payload, { onConflict: 'sku' })

        if (error) {
          console.error(`Row error for SKU ${row.sku}:`, error)
          errors++
        } else {
          success++
        }
      } catch (rowErr) {
        console.error('Row processing error:', rowErr)
        errors++
      }
    }

    return NextResponse.json({ success, errors })
  } catch (err) {
    console.error('Import error:', err)
    return NextResponse.json({ error: 'Import failed' }, { status: 500 })
  }
}
