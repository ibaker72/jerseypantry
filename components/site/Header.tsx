'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ShoppingCart, Menu, X, Search, ChevronRight } from 'lucide-react'
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
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <span className="text-2xl">🏪</span>
              <div className="hidden sm:block leading-none">
                <span className="text-lg font-bold text-brand-green">My Corner</span>
                <span className="text-lg font-bold text-brand-orange"> Store</span>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative px-4 py-2 text-sm font-medium rounded-xl transition-colors',
                    isActive(link.href)
                      ? 'text-brand-green bg-brand-green/5'
                      : 'text-gray-600 hover:text-brand-green hover:bg-gray-50'
                  )}
                >
                  {link.label}
                  {isActive(link.href) && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-orange" />
                  )}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Link
                href="/shop"
                className="p-2 text-gray-500 hover:text-brand-green hover:bg-gray-50 rounded-xl transition-colors"
                aria-label="Search products"
              >
                <Search className="h-5 w-5" />
              </Link>

              <button
                suppressHydrationWarning
                onClick={openCart}
                className="relative p-2 text-gray-500 hover:text-brand-green hover:bg-gray-50 rounded-xl transition-colors"
                aria-label="Open cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-orange text-[10px] font-bold text-white shadow-sm">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>

              <Button
                size="sm"
                variant="orange"
                className="hidden sm:inline-flex lg:hidden"
                asChild
              >
                <Link href="/shop">Shop</Link>
              </Button>

              <button
                suppressHydrationWarning
                className="lg:hidden p-2 text-gray-500 hover:text-brand-green hover:bg-gray-50 rounded-xl transition-colors"
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
                  className={cn(
                    'flex items-center justify-between px-6 py-3.5 text-sm font-medium transition-colors',
                    isActive(link.href)
                      ? 'text-brand-green bg-brand-green/5'
                      : 'text-gray-700 hover:bg-brand-cream hover:text-brand-green'
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  <span>{link.label}</span>
                  <ChevronRight
                    className={cn(
                      'h-4 w-4',
                      isActive(link.href) ? 'text-brand-green' : 'text-gray-400'
                    )}
                  />
                </Link>
              ))}
            </nav>
            <div className="px-4 pb-4 pt-2 border-t border-gray-100">
              <Button variant="orange" size="lg" className="w-full" asChild>
                <Link href="/shop" onClick={() => setMobileOpen(false)}>
                  Shop Now
                </Link>
              </Button>
            </div>
          </div>
        )}
      </header>
      <CartDrawer />
    </>
  )
}
