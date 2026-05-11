'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  createSupplier,
  updateSupplier,
  archiveSupplier,
} from '@/lib/actions/suppliers'
import type { Supplier } from '@/types'

const TERMS_OPTIONS: { value: string; label: string }[] = [
  { value: 'prepaid', label: 'Prepaid' },
  { value: 'cash', label: 'Cash on delivery' },
  { value: 'net15', label: 'Net 15' },
  { value: 'net30', label: 'Net 30' },
  { value: 'net60', label: 'Net 60' },
  { value: 'other', label: 'Other' },
]

export function SupplierForm({ supplier }: { supplier?: Supplier }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!supplier

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const result = isEdit
        ? await updateSupplier(supplier!.id, form)
        : await createSupplier(form)
      if (result && 'ok' in result && !result.ok) {
        setError(result.error)
      } else if (isEdit) {
        router.refresh()
      }
    })
  }

  const handleArchive = () => {
    if (!isEdit) return
    if (!confirm('Archive this supplier?')) return
    startTransition(async () => {
      await archiveSupplier(supplier!.id)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-brand-charcoal border-b pb-3">
          Supplier Info
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="s-name">Name *</Label>
            <Input
              id="s-name"
              name="name"
              required
              defaultValue={supplier?.name ?? ''}
              placeholder="Restaurant Depot — Paterson"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-contact">Contact name</Label>
            <Input
              id="s-contact"
              name="contact_name"
              defaultValue={supplier?.contact_name ?? ''}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-email">Email</Label>
            <Input
              id="s-email"
              name="email"
              type="email"
              defaultValue={supplier?.email ?? ''}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-phone">Phone</Label>
            <Input
              id="s-phone"
              name="phone"
              defaultValue={supplier?.phone ?? ''}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-website">Website</Label>
            <Input
              id="s-website"
              name="website"
              type="url"
              defaultValue={supplier?.website ?? ''}
              placeholder="https://"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="s-address">Address</Label>
            <Input
              id="s-address"
              name="address"
              defaultValue={supplier?.address ?? ''}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-terms">Payment terms</Label>
            <select
              id="s-terms"
              name="payment_terms"
              defaultValue={supplier?.payment_terms ?? 'prepaid'}
              className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              {TERMS_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={supplier?.is_active ?? true}
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="s-notes">Notes</Label>
            <Textarea
              id="s-notes"
              name="notes"
              rows={3}
              defaultValue={supplier?.notes ?? ''}
              placeholder="Cash-and-carry only, must arrive before 2pm, etc."
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Save className="h-4 w-4" />
              {isEdit ? 'Save Changes' : 'Create Supplier'}
            </>
          )}
        </Button>
        {isEdit && (
          <Button
            type="button"
            size="lg"
            variant="outline"
            onClick={handleArchive}
            disabled={pending}
          >
            <Archive className="h-4 w-4" /> Archive
          </Button>
        )}
      </div>
    </form>
  )
}
