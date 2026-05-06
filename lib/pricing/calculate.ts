import type { CartItem, FulfillmentMethod, PricingSummary } from '@/types'

const SHIPPING_FEE = 8.99
const DEFAULT_DELIVERY_FEE = 4.99
const DEFAULT_FREE_DELIVERY_MINIMUM = 50.00

export function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.retail_price * item.quantity, 0)
}

export function calculateDeliveryFee(
  subtotal: number,
  fulfillmentMethod: FulfillmentMethod,
  zoneDeliveryFee: number = DEFAULT_DELIVERY_FEE,
  zoneFreeMinimum: number = DEFAULT_FREE_DELIVERY_MINIMUM
): number {
  if (fulfillmentMethod === 'pickup') return 0
  if (fulfillmentMethod === 'shipping') return SHIPPING_FEE
  // local_delivery
  if (subtotal >= zoneFreeMinimum) return 0
  return zoneDeliveryFee
}

export function calculateDiscount(
  subtotal: number,
  couponType: 'percent' | 'fixed' | null,
  couponValue: number
): number {
  if (!couponType) return 0
  if (couponType === 'percent') {
    return parseFloat(((subtotal * couponValue) / 100).toFixed(2))
  }
  return Math.min(couponValue, subtotal)
}

export function calculatePricing(
  items: CartItem[],
  fulfillmentMethod: FulfillmentMethod,
  zoneDeliveryFee?: number,
  zoneFreeMinimum?: number,
  couponType?: 'percent' | 'fixed' | null,
  couponValue?: number
): PricingSummary {
  const subtotal = calculateSubtotal(items)
  const deliveryFee = fulfillmentMethod === 'local_delivery'
    ? calculateDeliveryFee(subtotal, fulfillmentMethod, zoneDeliveryFee, zoneFreeMinimum)
    : 0
  const shippingFee = fulfillmentMethod === 'shipping' ? SHIPPING_FEE : 0
  const discountAmount = couponType && couponValue
    ? calculateDiscount(subtotal, couponType, couponValue)
    : 0
  const taxAmount = 0 // TODO: integrate Stripe Tax or manual NJ tax rate
  const total = Math.max(0, subtotal + deliveryFee + shippingFee + taxAmount - discountAmount)

  return {
    subtotal,
    delivery_fee: deliveryFee,
    shipping_fee: shippingFee,
    tax_amount: taxAmount,
    discount_amount: discountAmount,
    total: parseFloat(total.toFixed(2)),
  }
}
