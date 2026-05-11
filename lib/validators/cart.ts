import { z } from 'zod'

export const checkoutItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
  is_wholesale: z.boolean().optional(),
})

export const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, 'Cart is empty'),
  fulfillment_method: z.enum(['local_delivery', 'pickup', 'shipping']),
  email: z.string().email(),
  postal_code: z.string().optional(),
  coupon_code: z.string().optional(),
  loyalty_points_to_redeem: z.number().int().min(0).optional().default(0),
  delivery_address: z
    .object({
      line1: z.string().min(1),
      line2: z.string().optional(),
      city: z.string().min(1),
      state: z.string().min(1),
      postal_code: z.string().min(5),
      country: z.string().default('US'),
      delivery_instructions: z.string().optional(),
    })
    .optional(),
})

export const productImportRowSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  sku: z.string().min(1),
  wholesale_cost: z.coerce.number().min(0),
  retail_price: z.coerce.number().min(0.01),
  inventory_quantity: z.coerce.number().int().min(0),
  description: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  barcode: z.string().optional(),
  brand: z.string().optional(),
  size: z.string().optional(),
  unit: z.string().optional(),
  shipping_eligible: z.coerce.boolean().default(true),
  delivery_eligible: z.coerce.boolean().default(true),
  reorder_threshold: z.coerce.number().int().min(0).default(5),
})

export type CheckoutInput = z.infer<typeof checkoutSchema>
export type ProductImportRow = z.infer<typeof productImportRowSchema>
