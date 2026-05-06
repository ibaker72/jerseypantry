import type { Cart, CartItem } from '@/types'

const CART_STORAGE_KEY = 'mcs_cart'

const defaultCart: Cart = {
  items: [],
  fulfillment_method: 'local_delivery',
  postal_code: '',
  coupon_code: '',
}

export function loadCart(): Cart {
  if (typeof window === 'undefined') return defaultCart
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return defaultCart
    return JSON.parse(raw) as Cart
  } catch {
    return defaultCart
  }
}

export function saveCart(cart: Cart): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
}

export function clearCart(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CART_STORAGE_KEY)
}

export function addItem(cart: Cart, item: CartItem): Cart {
  const existing = cart.items.find((i) => i.product_id === item.product_id)
  if (existing) {
    const newQty = Math.min(existing.quantity + item.quantity, item.inventory_quantity)
    return {
      ...cart,
      items: cart.items.map((i) =>
        i.product_id === item.product_id ? { ...i, quantity: newQty } : i
      ),
    }
  }
  return { ...cart, items: [...cart.items, item] }
}

export function removeItem(cart: Cart, productId: string): Cart {
  return { ...cart, items: cart.items.filter((i) => i.product_id !== productId) }
}

export function updateQuantity(cart: Cart, productId: string, quantity: number): Cart {
  if (quantity <= 0) return removeItem(cart, productId)
  return {
    ...cart,
    items: cart.items.map((i) =>
      i.product_id === productId
        ? { ...i, quantity: Math.min(quantity, i.inventory_quantity) }
        : i
    ),
  }
}

export function cartItemCount(cart: Cart): number {
  return cart.items.reduce((sum, i) => sum + i.quantity, 0)
}
