'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ShoppingCart, Menu, X, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/components/cart/CartContext'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { cn } from '@/lib/utils/cn'

const navLinks = [
  { href: '/shop', label: 'Shop' },
  { href: '/bundles', label: 'Bundles' },
  { href: '/local-delivery', label: 'Local Delivery' },
  { href: '/office-refill', label: 'Office Refill' },
  { href: '/about', label: 'About' },
]

export function Header() {
  const { itemCount, openCart } = useCart()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <span className="text-2xl">🏪</span>
              <div className="hidden sm:block">
                <span className="text-lg font-bold text-brand-green leading-none">My Corner</span>
                <span className="text-lg font-bold text-brand-orange leading-none"> Store</span>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-gray-600 hover:text-brand-green transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Link href="/shop" className="p-2 text-gray-600 hover:text-brand-green transition-colors">
                <Search className="h-5 w-5" />
                <span className="sr-only">Search</span>
              </Link>

              <button
                suppressHydrationWarning
                onClick={openCart}
                className="relative p-2 text-gray-600 hover:text-brand-green transition-colors"
                aria-label="Open cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-orange text-[10px] font-bold text-white">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>

              <button
                suppressHydrationWarning
                className="lg:hidden p-2 text-gray-600 hover:text-brand-green transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white">
            <nav className="flex flex-col py-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-6 py-3 text-sm font-medium text-gray-700 hover:bg-brand-cream hover:text-brand-green transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>
      <CartDrawer />
    </>
  )
}
