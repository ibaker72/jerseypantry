import Link from 'next/link'
import { MapPin, Mail, ArrowRight } from 'lucide-react'

const NJ_CITIES = ['Passaic', 'Clifton', 'Paterson', 'Rutherford', 'Garfield', 'Wallington', 'Lodi', 'Saddle Brook']

export function Footer() {
  return (
    <footer className="bg-brand-green text-white mt-auto">
      {/* Delivery coverage strip */}
      <div className="border-b border-green-700/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-green-300">
            <span className="font-semibold text-green-100 shrink-0">📍 Delivering to:</span>
            {NJ_CITIES.map((city, i) => (
              <span key={city}>
                {city}
                {i < NJ_CITIES.length - 1 && <span className="ml-2 text-green-600">·</span>}
              </span>
            ))}
            <span className="text-green-500">& surrounding areas</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🏪</span>
              <div className="leading-none">
                <span className="text-lg font-bold">My Corner</span>
                <span className="text-lg font-bold text-brand-orange"> Store</span>
              </div>
            </div>
            <p className="text-sm text-green-200 leading-relaxed mb-5">
              Your corner store, online. Snacks, drinks, household essentials, and local favorites delivered same-day around North Jersey.
            </p>
            <div className="flex flex-col gap-2.5 text-sm text-green-300">
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" /> North Jersey, NJ
              </span>
              <a
                href="mailto:hello@mycornerstore.com"
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <Mail className="h-4 w-4 shrink-0" /> hello@mycornerstore.com
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold mb-4 text-green-100">Shop</h4>
            <ul className="space-y-2.5 text-sm text-green-300">
              {[
                { href: '/shop', label: 'All Products' },
                { href: '/bundles', label: 'Curated Bundles' },
                { href: '/categories/middle-eastern-favorites', label: 'Middle Eastern' },
                { href: '/categories/drinks', label: 'Drinks & Energy' },
                { href: '/categories/chips-salty-snacks', label: 'Snacks' },
                { href: '/categories/household-essentials', label: 'Household' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-4 text-green-100">Services</h4>
            <ul className="space-y-2.5 text-sm text-green-300">
              {[
                { href: '/local-delivery', label: 'Local Delivery' },
                { href: '/office-refill', label: 'Office Refill Program' },
                { href: '/bundles/build', label: 'Bundle Builder' },
                { href: '/about', label: 'About Us' },
                { href: '/contact', label: 'Contact' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Why Us + Office CTA */}
          <div>
            <h4 className="font-semibold mb-4 text-green-100">Why My Corner Store</h4>
            <ul className="space-y-2.5 text-sm text-green-300 mb-6">
              <li className="flex items-center gap-2">🚚 Same-day local delivery</li>
              <li className="flex items-center gap-2">🔒 Secure checkout</li>
              <li className="flex items-center gap-2">📍 Local NJ inventory</li>
              <li className="flex items-center gap-2">🎁 Free delivery over $50</li>
              <li className="flex items-center gap-2">💼 Office refill programs</li>
            </ul>
            <Link
              href="/office-refill"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-orange hover:text-orange-300 transition-colors"
            >
              B2B Refill Plans <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-green-700 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-green-400">
          <p>© {new Date().getFullYear()} My Corner Store. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>North Jersey&apos;s local online corner store</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
