import { Suspense } from 'react'
import { OrderSuccessContent } from './OrderSuccessContent'

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="max-w-xl mx-auto px-4 py-20 text-center text-gray-400">Loading…</div>}>
      <OrderSuccessContent />
    </Suspense>
  )
}
