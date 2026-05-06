import Link from 'next/link'
import { MapPin, Phone, Mail } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-brand-green text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🏪</span>
              <div>
                <span className="text-lg font-bold leading-none">My Corner</span>
                <span className="text-lg font-bold text-brand-orange leading-none"> Store</span>
              </div>
            </div>
            <p className="text-sm text-green-200 leading-relaxed mb-4">
              Your corner store, online. Snacks, drinks, household essentials, and local favorites delivered same-day around North Jersey.
            </p>
            <div className="flex flex-col gap-2 text-sm text-green-200">
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" /> North Jersey, NJ
              </span>
              <a href="mailto:hello@mycornerstore.com" className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail className="h-4 w-4 shrink-0" /> hello@mycornerstore.com
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold mb-3 text-green-100">Shop</h4>
            <ul className="space-y-2 text-sm text-green-200">
              {[
                { href: '/shop', label: 'All Products' },
                { href: '/bundles', label: 'Bundles' },
                { href: '/categories/middle-eastern-favorites', label: 'Middle Eastern' },
                { href: '/categories/drinks', label: 'Drinks' },
                { href: '/categories/chips-salty-snacks', label: 'Snacks' },
                { href: '/categories/household-essentials', label: 'Household' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-3 text-green-100">Services</h4>
            <ul className="space-y-2 text-sm text-green-200">
              {[
                { href: '/local-delivery', label: 'Local Delivery' },
                { href: '/office-refill', label: 'Office Refill' },
                { href: '/about', label: 'About Us' },
                { href: '/contact', label: 'Contact' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Trust */}
          <div>
            <h4 className="font-semibold mb-3 text-green-100">Why Us</h4>
            <ul className="space-y-2 text-sm text-green-200">
              <li>🚚 Same-day local delivery</li>
              <li>🔒 Secure checkout</li>
              <li>📍 Local NJ inventory</li>
              <li>🎁 Free delivery over $50</li>
              <li>💼 Office refill programs</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-green-700 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-green-300">
          <p>© {new Date().getFullYear()} My Corner Store. All rights reserved.</p>
          <p>North Jersey&apos;s local online corner store.</p>
        </div>
      </div>
    </footer>
  )
}
