import type { DeliveryZone, FulfillmentMethod, CartItem } from '@/types'

export interface DeliveryCheckResult {
  available: boolean
  zone: DeliveryZone | null
  reason?: string
}

export function checkDeliveryEligibility(
  postalCode: string,
  zones: DeliveryZone[]
): DeliveryCheckResult {
  const zone = zones.find(
    (z) => z.postal_code === postalCode.trim() && z.is_active
  )
  if (!zone) {
    return {
      available: false,
      zone: null,
      reason: `We don't currently deliver to ZIP code ${postalCode}. Check back soon!`,
    }
  }
  return { available: true, zone }
}

export function validateFulfillmentItems(
  items: CartItem[],
  method: FulfillmentMethod
): { valid: boolean; invalidItems: string[] } {
  if (method === 'pickup') return { valid: true, invalidItems: [] }

  const invalidItems: string[] = []

  for (const item of items) {
    if (method === 'shipping' && !item.shipping_eligible) {
      invalidItems.push(item.name)
    }
    if (method === 'local_delivery' && !item.delivery_eligible) {
      invalidItems.push(item.name)
    }
  }

  return {
    valid: invalidItems.length === 0,
    invalidItems,
  }
}
