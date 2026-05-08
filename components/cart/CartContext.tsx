'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { Cart, CartItem, FulfillmentMethod } from '@/types'
import {
  loadCart,
  saveCart,
  addItem,
  removeItem,
  updateQuantity,
  cartItemCount,
  clearCart as clearCartStorage,
} from '@/lib/cart/storage'
import { calculateSubtotal } from '@/lib/pricing/calculate'

interface CartDataContextValue {
  cart: Cart
  itemCount: number
  subtotal: number
  addToCart: (item: CartItem) => void
  removeFromCart: (productId: string) => void
  updateItemQuantity: (productId: string, quantity: number) => void
  setFulfillmentMethod: (method: FulfillmentMethod) => void
  setPostalCode: (zip: string) => void
  setCouponCode: (code: string) => void
  clearCart: () => void
}

interface CartUIContextValue {
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
}

const CartDataContext = createContext<CartDataContextValue | null>(null)
const CartUIContext = createContext<CartUIContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>({
    items: [],
    fulfillment_method: 'local_delivery',
    postal_code: '',
    coupon_code: '',
  })
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setCart(loadCart())
  }, [])

  const persist = useCallback((updated: Cart) => {
    setCart(updated)
    saveCart(updated)
  }, [])

  const addToCart = useCallback(
    (item: CartItem) => {
      persist(addItem(cart, item))
      setIsOpen(true)
    },
    [cart, persist]
  )

  const removeFromCart = useCallback(
    (productId: string) => {
      persist(removeItem(cart, productId))
    },
    [cart, persist]
  )

  const updateItemQuantity = useCallback(
    (productId: string, quantity: number) => {
      persist(updateQuantity(cart, productId, quantity))
    },
    [cart, persist]
  )

  const setFulfillmentMethod = useCallback(
    (method: FulfillmentMethod) => {
      persist({ ...cart, fulfillment_method: method })
    },
    [cart, persist]
  )

  const setPostalCode = useCallback(
    (zip: string) => {
      persist({ ...cart, postal_code: zip })
    },
    [cart, persist]
  )

  const setCouponCode = useCallback(
    (code: string) => {
      persist({ ...cart, coupon_code: code })
    },
    [cart, persist]
  )

  const clearCart = useCallback(() => {
    clearCartStorage()
    setCart({
      items: [],
      fulfillment_method: 'local_delivery',
      postal_code: '',
      coupon_code: '',
    })
  }, [])

  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])

  return (
    <CartDataContext.Provider
      value={{
        cart,
        itemCount: cartItemCount(cart),
        subtotal: calculateSubtotal(cart.items),
        addToCart,
        removeFromCart,
        updateItemQuantity,
        setFulfillmentMethod,
        setPostalCode,
        setCouponCode,
        clearCart,
      }}
    >
      <CartUIContext.Provider value={{ isOpen, openCart, closeCart }}>
        {children}
      </CartUIContext.Provider>
    </CartDataContext.Provider>
  )
}

export function useCart(): CartDataContextValue {
  const ctx = useContext(CartDataContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

export function useCartUI(): CartUIContextValue {
  const ctx = useContext(CartUIContext)
  if (!ctx) throw new Error('useCartUI must be used within CartProvider')
  return ctx
}
