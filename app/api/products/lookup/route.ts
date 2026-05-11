import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Looks up a barcode against:
//   1. our own products table (so duplicates surface immediately)
//   2. Open Food Facts (free, no key, US/global coverage for groceries)
//
// Returns a normalized shape the admin product form can autofill.

interface OffProduct {
  product_name?: string
  product_name_en?: string
  brands?: string
  quantity?: string
  image_front_url?: string
  image_url?: string
  generic_name?: string
  categories?: string
}

interface OffResponse {
  status: 0 | 1
  product?: OffProduct
}

export async function GET(req: NextRequest) {
  const barcode = req.nextUrl.searchParams.get('barcode')?.trim()
  if (!barcode || !/^[0-9]{6,14}$/.test(barcode)) {
    return NextResponse.json(
      { error: 'Provide a numeric barcode (6–14 digits)' },
      { status: 400 }
    )
  }

  // 1. Local lookup — flag a dupe up front so we don't double-create.
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('products')
    .select('id, name, slug, brand, size, image_url, retail_price, inventory_quantity')
    .eq('barcode', barcode)
    .limit(1)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({
      barcode,
      source: 'local' as const,
      existing_product: existing,
    })
  }

  // 2. Open Food Facts
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,product_name_en,brands,quantity,image_front_url,image_url,generic_name,categories`,
      {
        headers: {
          // OFF asks for a User-Agent identifying the app.
          'User-Agent': 'MyCornerStore/1.0 (https://mycornerstore.com)',
        },
        // OFF is occasionally slow — don't hang the form forever.
        signal: AbortSignal.timeout(6000),
      }
    )

    if (!res.ok) {
      return NextResponse.json({
        barcode,
        source: 'off' as const,
        found: false,
      })
    }

    const data = (await res.json()) as OffResponse
    if (data.status !== 1 || !data.product) {
      return NextResponse.json({
        barcode,
        source: 'off' as const,
        found: false,
      })
    }

    const p = data.product
    const name = (p.product_name_en || p.product_name || p.generic_name || '').trim()
    if (!name) {
      return NextResponse.json({
        barcode,
        source: 'off' as const,
        found: false,
      })
    }

    return NextResponse.json({
      barcode,
      source: 'off' as const,
      found: true,
      product: {
        name,
        brand: p.brands ? p.brands.split(',')[0].trim() : null,
        size: p.quantity?.trim() || null,
        image_url: p.image_front_url || p.image_url || null,
        description: p.generic_name?.trim() || null,
        categories: p.categories?.trim() || null,
      },
    })
  } catch (err) {
    console.error('OFF lookup failed:', err)
    return NextResponse.json({
      barcode,
      source: 'off' as const,
      found: false,
      error: 'Lookup timed out',
    })
  }
}
