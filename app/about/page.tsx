import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Heart, MapPin, Star, Truck } from 'lucide-react'

export const metadata = {
  title: 'About Us',
  description: 'The story behind My Corner Store — North Jersey\'s local online convenience store.',
}

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="text-5xl mb-4">🏪</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-brand-charcoal mb-4">
          Your neighborhood corner store, now online.
        </h1>
        <p className="text-gray-500 text-lg leading-relaxed">
          We started My Corner Store because we believed everyone deserves quick, local access to the everyday essentials — from your favorite snacks to Middle Eastern pantry staples — without a trip to the store.
        </p>
      </div>

      {/* Values */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {[
          { icon: <MapPin className="h-6 w-6 text-brand-green" />, title: 'Rooted in NJ', desc: 'We\'re based in North Jersey and deliver exclusively to communities we know and love.' },
          { icon: <Truck className="h-6 w-6 text-brand-green" />, title: 'Same-Day Delivery', desc: 'Fast, local delivery so you never have to wait for your favorites.' },
          { icon: <Star className="h-6 w-6 text-brand-green" />, title: 'Local Favorites', desc: 'We stock Middle Eastern staples and local favorites alongside everyday brands.' },
          { icon: <Heart className="h-6 w-6 text-brand-green" />, title: 'Community First', desc: 'We believe in serving our community with honest pricing and real customer care.' },
        ].map((v) => (
          <div key={v.title} className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-brand-cream flex items-center justify-center mb-4">
              {v.icon}
            </div>
            <h3 className="font-semibold text-brand-charcoal mb-1">{v.title}</h3>
            <p className="text-sm text-gray-500">{v.desc}</p>
          </div>
        ))}
      </div>

      {/* Story */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-charcoal mb-4">Our Story</h2>
          <div className="space-y-4 text-gray-600 leading-relaxed">
            <p>
              North Jersey is home to one of the most diverse communities in America. Paterson, Clifton, Passaic, and the surrounding cities have a rich culture of corner stores, bodegas, and specialty shops that provide everything from household staples to authentic Middle Eastern and Latin pantry goods.
            </p>
            <p>
              My Corner Store brings that convenience online. We stock everything you&apos;d find at your local bodega — your favorite snacks, drinks, household essentials — plus the authentic ingredients and products that make North Jersey home. Medjool dates, zaatar, Turkish coffee, and more, available for same-day delivery.
            </p>
            <p>
              We also serve businesses. Our Office Refill program means dealerships, barbershops, gyms, and offices in the area never run out of the snacks and drinks their teams and customers expect.
            </p>
          </div>
        </div>
        <div className="rounded-3xl bg-gradient-to-br from-brand-green to-[#2d6a4f] text-white p-10 text-center">
          <div className="text-6xl mb-4">🌿</div>
          <p className="text-green-100 text-lg font-medium italic">
            &quot;Your corner store, online.&quot;
          </p>
          <p className="text-green-200 text-sm mt-2">Serving North Jersey with pride.</p>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center rounded-3xl bg-brand-cream border border-gray-100 p-12">
        <h2 className="text-2xl font-bold text-brand-charcoal mb-3">Ready to shop?</h2>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Browse our full selection of snacks, drinks, essentials, and local favorites — delivered same-day.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" asChild>
            <Link href="/shop">Shop Now</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/contact">Contact Us</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
