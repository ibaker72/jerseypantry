import { Suspense } from 'react'
import { CartPageContent } from './CartPageContent'

export default function CartPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-400">Loading cart…</div>}>
      <CartPageContent />
    </Suspense>
  )
}
