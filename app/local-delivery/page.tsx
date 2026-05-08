import Link from 'next/link'
import { Truck, Clock, MapPin, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DeliveryZoneChecker } from '@/components/shop/DeliveryZoneChecker'
import { createClient } from '@/lib/supabase/server'
import type { DeliveryZone } from '@/types'

export const metadata = {
  title: 'Local Delivery',
  description: 'Same-day local delivery across North Jersey. Check your ZIP code.',
}

export default async function LocalDeliveryPage() {
  const supabase = await createClient()
  const { data: zones } = await supabase
    .from('delivery_zones')
    .select('city, postal_code, delivery_fee, free_delivery_minimum')
    .eq('is_active', true)
    .order('city')

  const cities = Array.from(new Set((zones ?? []).map((z: Pick<DeliveryZone, 'city'>) => z.city).filter(Boolean))) as string[]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero */}
      <div className="rounded-3xl bg-gradient-to-br from-brand-green to-[#2d6a4f] text-white p-8 sm:p-12 mb-12">
        <div className="flex items-center gap-2 mb-3">
          <Truck className="h-6 w-6 text-green-300" />
          <span className="text-green-200 text-sm font-medium">Same-Day Local Delivery</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Fast & Local, Right to Your Door</h1>
        <p className="text-green-100 max-w-xl leading-relaxed mb-6">
          We deliver snacks, drinks, household essentials, and Middle Eastern favorites same-day across North Jersey. $4.99 fee, free over $50. Mon–Sat, 10AM–3PM.
        </p>
        <Button size="xl" variant="orange" asChild>
          <Link href="/shop">Shop for Delivery</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Zone checker */}
        <div>
          <h2 className="text-2xl font-bold text-brand-charcoal mb-4">Check Your ZIP Code</h2>
          <DeliveryZoneChecker />

          {/* Delivery zones list */}
          <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6">
            <h3 className="font-semibold text-brand-charcoal mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-green" /> Current Delivery Areas
            </h3>
            <div className="flex flex-wrap gap-2">
              {cities.map((city) => (
                <span key={city} className="text-sm rounded-full bg-brand-cream border border-gray-100 px-3 py-1 text-gray-700">
                  {city}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4">Expanding to more areas soon. Sign up for updates.</p>
          </div>
        </div>

        {/* How it works */}
        <div>
          <h2 className="text-2xl font-bold text-brand-charcoal mb-6">How Local Delivery Works</h2>
          <div className="space-y-5">
            {[
              { icon: '🛒', title: 'Shop Online', desc: 'Browse products and add items to your cart. Look for the "Delivery Eligible" badge.' },
              { icon: '📍', title: 'Enter Your ZIP', desc: 'At checkout, enter your ZIP code to confirm delivery is available in your area.' },
              { icon: '💳', title: 'Secure Checkout', desc: 'Pay securely with Stripe. $4.99 delivery fee — free over $50.' },
              { icon: '🚚', title: 'Same-Day Delivery', desc: 'We prep and deliver your order same-day during delivery hours.' },
            ].map((step) => (
              <div key={step.title} className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-cream flex items-center justify-center text-2xl shrink-0">
                  {step.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-brand-charcoal">{step.title}</h4>
                  <p className="text-sm text-gray-500 mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Delivery details */}
          <div className="mt-8 rounded-2xl bg-brand-cream border border-gray-100 p-6 space-y-3">
            <h3 className="font-semibold text-brand-charcoal">Delivery Details</h3>
            {[
              'Delivery fee: $4.99 (free over $50)',
              'Order by 2PM for same-day delivery',
              'Delivery hours: Mon–Sat, 10AM – 3PM',
              'No Sunday delivery — check back soon',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="h-4 w-4 text-brand-green shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
