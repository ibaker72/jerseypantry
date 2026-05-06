import Link from 'next/link'
import { XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'Order Canceled' }

export default function OrderCanceledPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
        <XCircle className="h-10 w-10 text-red-400" />
      </div>
      <h1 className="text-3xl font-bold text-brand-charcoal mb-3">Order Canceled</h1>
      <p className="text-gray-500 mb-8">
        No worries — your order was not charged. Your cart is still saved.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild size="lg">
          <Link href="/cart">Back to Cart</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/shop">Browse Products</Link>
        </Button>
      </div>
    </div>
  )
}
