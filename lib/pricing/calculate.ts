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

export const LOYALTY_POINTS_PER_DOLLAR = 1   // points earned per $1 subtotal
export const LOYALTY_POINTS_TO_DOLLAR  = 100  // points needed per $1 redeemed

export function loyaltyPointsToAmount(points: number): number {
  return parseFloat((points / LOYALTY_POINTS_TO_DOLLAR).toFixed(2))
}

export function calculatePricing(
  items: CartItem[],
  fulfillmentMethod: FulfillmentMethod,
  zoneDeliveryFee?: number,
  zoneFreeMinimum?: number,
  couponType?: 'percent' | 'fixed' | null,
  couponValue?: number,
  loyaltyPointsToRedeem: number = 0
): PricingSummary {
  const subtotal = calculateSubtotal(items)
  const deliveryFee = fulfillmentMethod === 'local_delivery'
    ? calculateDeliveryFee(subtotal, fulfillmentMethod, zoneDeliveryFee, zoneFreeMinimum)
    : 0
  const shippingFee = fulfillmentMethod === 'shipping' ? SHIPPING_FEE : 0
  const discountAmount = couponType && couponValue
    ? calculateDiscount(subtotal, couponType, couponValue)
    : 0
  const loyaltyRedemptionAmount = loyaltyPointsToAmount(loyaltyPointsToRedeem)
  const taxAmount = 0
  const total = Math.max(0, subtotal + deliveryFee + shippingFee + taxAmount - discountAmount - loyaltyRedemptionAmount)

  return {
    subtotal,
    delivery_fee: deliveryFee,
    shipping_fee: shippingFee,
    tax_amount: taxAmount,
    discount_amount: discountAmount,
    loyalty_redemption_amount: loyaltyRedemptionAmount,
    total: parseFloat(total.toFixed(2)),
  }
}
