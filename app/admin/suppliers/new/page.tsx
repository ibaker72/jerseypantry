import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SupplierForm } from '@/components/admin/SupplierForm'

export const metadata = { title: 'New Supplier — Admin' }

export default function NewSupplierPage() {
  return (
    <div>
      <Link
        href="/admin/suppliers"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-green mb-3"
      >
        <ArrowLeft className="h-4 w-4" /> Back to suppliers
      </Link>
      <h1 className="text-2xl font-bold text-brand-charcoal mb-6">New Supplier</h1>
      <SupplierForm />
    </div>
  )
}
