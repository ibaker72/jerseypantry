'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2, PackagePlus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { StockRequestSource } from '@/types'

interface StockRequestDialogProps {
  trigger?: React.ReactNode
  productId?: string | null
  defaultProductName?: string
  defaultBrand?: string
  defaultSize?: string
  source?: StockRequestSource
  mode?: 'request' | 'notify'
}

export function StockRequestDialog({
  trigger,
  productId = null,
  defaultProductName = '',
  defaultBrand = '',
  defaultSize = '',
  source = 'storefront',
  mode = 'request',
}: StockRequestDialogProps) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [productName, setProductName] = useState(defaultProductName)
  const [brand, setBrand] = useState(defaultBrand)
  const [size, setSize] = useState(defaultSize)
  const [notes, setNotes] = useState('')
  const [email, setEmail] = useState('')

  const reset = () => {
    setSubmitting(false)
    setDone(false)
    setError(null)
    setProductName(defaultProductName)
    setBrand('')
    setSize('')
    setNotes('')
    setEmail('')
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      // small delay so users see success state before reset
      setTimeout(reset, 250)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/stock-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          product_name: productName,
          brand,
          size,
          notes,
          email,
          source: productId ? 'product_page' : source,
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? 'Something went wrong')
      }
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-orange hover:text-orange-300 transition-colors"
          >
            <PackagePlus className="h-4 w-4" />
            Request an item
          </button>
        )}
      </DialogTrigger>
      <DialogContent>
        {done ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-12 w-12 text-brand-green mx-auto mb-3" />
            <DialogTitle className="text-xl mb-1">
              {mode === 'notify' ? 'You’re on the list!' : 'Got it — thanks!'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'notify'
                ? email
                  ? 'We’ll email you the moment it’s back in stock.'
                  : 'Add your email next time and we’ll ping you when it’s back.'
                : `We’ll review requests weekly and stock the most-asked items.${email ? ' We’ll email you when it’s in.' : ''}`}
            </DialogDescription>
            <Button className="mt-5" onClick={() => handleOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                {mode === 'notify'
                  ? 'Notify me when it’s back'
                  : 'Request an item we don’t carry'}
              </DialogTitle>
              <DialogDescription>
                {mode === 'notify'
                  ? 'Drop your email and we’ll let you know the moment it’s restocked.'
                  : 'Tell us what you wish we stocked. The more requests an item gets, the more likely we are to add it.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="sr-name">What product? *</Label>
                <Input
                  id="sr-name"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Takis Fuego, 9.9oz"
                  maxLength={200}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sr-brand">Brand</Label>
                  <Input
                    id="sr-brand"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="optional"
                    maxLength={100}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sr-size">Size</Label>
                  <Input
                    id="sr-size"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="optional"
                    maxLength={50}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sr-email">Email (to notify you)</Label>
                <Input
                  id="sr-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="optional"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sr-notes">Anything else?</Label>
                <Textarea
                  id="sr-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Flavor, variant, where you usually buy it…"
                  rows={3}
                  maxLength={1000}
                />
              </div>
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || !productName.trim()}>
                  {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                  Send request
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
