'use client'

import { useCallback, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  Loader2,
  Package,
  Plus,
  ScanLine,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { InlineBarcodeScanner } from '@/components/admin/InlineBarcodeScanner'
import {
  addItemToSession,
  createProductAndReceive,
  finalizeReceivingSession,
} from '@/lib/actions/receiving'
import { formatPrice } from '@/lib/utils/format'
import type { Category, InventoryLot, ReceivingSession } from '@/types'

interface LookupResponse {
  barcode: string
  source: 'local' | 'off'
  found?: boolean
  existing_product?: {
    id: string
    name: string
    slug: string
    brand: string | null
    size: string | null
    image_url: string | null
    retail_price: number
    inventory_quantity: number
    wholesale_cost?: number
  } | null
  product?: {
    name: string
    brand: string | null
    size: string | null
    image_url: string | null
    description: string | null
    categories: string | null
  }
}

type Sheet =
  | { kind: 'closed' }
  | { kind: 'loading'; barcode: string }
  | {
      kind: 'existing'
      barcode: string
      product: NonNullable<LookupResponse['existing_product']>
    }
  | {
      kind: 'new'
      barcode: string
      autofill: NonNullable<LookupResponse['product']> | null
    }
  | { kind: 'error'; message: string }

interface Props {
  session: ReceivingSession
  initialLots: (InventoryLot & {
    product: { id: string; name: string; sku: string | null } | null
  })[]
  categories: Category[]
}

export function ReceivingSessionClient({ session, initialLots, categories }: Props) {
  const router = useRouter()
  const [sheet, setSheet] = useState<Sheet>({ kind: 'closed' })
  const [pending, startTransition] = useTransition()
  const [finalizing, startFinalize] = useTransition()
  const [optimisticLots, setOptimisticLots] = useState(initialLots)

  const paused = sheet.kind !== 'closed'

  const handleDetected = useCallback(async (barcode: string) => {
    setSheet({ kind: 'loading', barcode })
    try {
      const res = await fetch(
        `/api/products/lookup?barcode=${encodeURIComponent(barcode)}`
      )
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setSheet({ kind: 'error', message: data.error ?? 'Lookup failed' })
        return
      }
      const data = (await res.json()) as LookupResponse
      if (data.source === 'local' && data.existing_product) {
        setSheet({
          kind: 'existing',
          barcode: data.barcode,
          product: data.existing_product,
        })
        return
      }
      if (data.found && data.product) {
        setSheet({ kind: 'new', barcode: data.barcode, autofill: data.product })
        return
      }
      setSheet({ kind: 'new', barcode: data.barcode, autofill: null })
    } catch (err) {
      setSheet({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Lookup failed',
      })
    }
  }, [])

  const closeSheet = () => setSheet({ kind: 'closed' })

  const handleFinalize = () => {
    if (!confirm('Finalize this session? You won’t be able to add more items.')) return
    startFinalize(async () => {
      const res = await finalizeReceivingSession(session.id)
      if (res.ok) {
        router.push('/admin/receiving')
      } else {
        alert(res.error)
      }
    })
  }

  const totalCost = optimisticLots.reduce((sum, l) => sum + Number(l.total_cost), 0)
  const totalUnits = optimisticLots.reduce((sum, l) => sum + l.quantity_received, 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Left: scanner column */}
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ScanLine className="h-5 w-5 text-brand-green" />
              <h2 className="font-semibold text-brand-charcoal">Scan items</h2>
            </div>
            <span className="text-xs text-gray-400">
              {session.supplier?.name ?? 'No supplier'}
            </span>
          </div>
          <InlineBarcodeScanner
            paused={paused}
            onResume={closeSheet}
            onDetected={handleDetected}
          />
          <p className="text-[11px] text-gray-400">
            Camera pauses after each scan. Use the dialog to confirm before resuming.
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
              Session total
            </p>
          </div>
          <p className="text-2xl font-bold text-brand-charcoal">
            {formatPrice(totalCost)}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {totalUnits} unit{totalUnits === 1 ? '' : 's'} across{' '}
            {optimisticLots.length} lot{optimisticLots.length === 1 ? '' : 's'}
          </p>
          <Button
            type="button"
            className="w-full mt-4"
            disabled={finalizing || optimisticLots.length === 0}
            onClick={handleFinalize}
          >
            {finalizing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" /> Finalize session
              </>
            )}
          </Button>
          <p className="text-[11px] text-gray-400 mt-2 text-center">
            Inventory is already updated for each lot. Finalize closes the session.
          </p>
        </div>
      </div>

      {/* Right: received list */}
      <div className="lg:col-span-3 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand-charcoal">
            Received this session
          </h2>
          <span className="text-xs text-gray-400">{optimisticLots.length} items</span>
        </div>

        {optimisticLots.length === 0 ? (
          <div className="rounded-2xl bg-white border border-dashed border-gray-200 p-10 text-center text-gray-400">
            <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Scan or enter a barcode to add your first item.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {optimisticLots.map((lot) => (
              <li
                key={lot.id}
                className="rounded-xl bg-white border border-gray-100 shadow-sm p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-brand-charcoal truncate">
                    {lot.product?.name ?? '—'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {lot.quantity_received} ×{' '}
                    {formatPrice(Number(lot.unit_cost))}
                    {lot.expiration_date && (
                      <span className="ml-2 text-orange-600">
                        exp {new Date(lot.expiration_date).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>
                <p className="font-bold text-brand-charcoal whitespace-nowrap">
                  {formatPrice(Number(lot.total_cost))}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Quick-add / new-product dialog */}
      <Dialog
        open={sheet.kind !== 'closed'}
        onOpenChange={(open) => {
          if (!open) closeSheet()
        }}
      >
        <DialogContent className="max-w-md">
          {sheet.kind === 'loading' && (
            <div className="py-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-brand-green mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                Looking up{' '}
                <span className="font-mono text-brand-charcoal">{sheet.barcode}</span>…
              </p>
            </div>
          )}

          {sheet.kind === 'error' && (
            <>
              <DialogHeader>
                <DialogTitle>Lookup failed</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">
                {sheet.message}
              </p>
              <div className="flex justify-end pt-2">
                <Button variant="ghost" onClick={closeSheet}>
                  Close
                </Button>
              </div>
            </>
          )}

          {sheet.kind === 'existing' && (
            <ExistingProductSheet
              sessionId={session.id}
              product={sheet.product}
              barcode={sheet.barcode}
              pending={pending}
              startTransition={startTransition}
              onSuccess={(newLot) => {
                setOptimisticLots((prev) => [newLot, ...prev])
                closeSheet()
                router.refresh()
              }}
              onCancel={closeSheet}
            />
          )}

          {sheet.kind === 'new' && (
            <NewProductSheet
              sessionId={session.id}
              barcode={sheet.barcode}
              autofill={sheet.autofill}
              categories={categories}
              pending={pending}
              startTransition={startTransition}
              onSuccess={(newLot) => {
                setOptimisticLots((prev) => [newLot, ...prev])
                closeSheet()
                router.refresh()
              }}
              onCancel={closeSheet}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Existing product quick-add ──────────────────────────────────

function ExistingProductSheet({
  sessionId,
  product,
  barcode,
  pending,
  startTransition,
  onSuccess,
  onCancel,
}: {
  sessionId: string
  product: NonNullable<LookupResponse['existing_product']>
  barcode: string
  pending: boolean
  startTransition: React.TransitionStartFunction
  onSuccess: (lot: InventoryLot & { product: { id: string; name: string; sku: string | null } | null }) => void
  onCancel: () => void
}) {
  const [quantity, setQuantity] = useState('1')
  const [unitCost, setUnitCost] = useState(
    product.wholesale_cost ? String(product.wholesale_cost) : ''
  )
  const [expiration, setExpiration] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const qty = parseInt(quantity, 10)
    const cost = parseFloat(unitCost || '0')
    startTransition(async () => {
      const res = await addItemToSession({
        session_id: sessionId,
        product_id: product.id,
        quantity: qty,
        unit_cost: cost,
        expiration_date: expiration || null,
        lot_number: null,
        notes: null,
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      const total = qty * cost
      onSuccess({
        id: res.lot_id,
        product_id: product.id,
        supplier_id: null,
        receiving_session_id: sessionId,
        quantity_received: qty,
        quantity_remaining: qty,
        unit_cost: cost,
        total_cost: total,
        lot_number: null,
        expiration_date: expiration || null,
        received_at: new Date().toISOString(),
        notes: null,
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        product: { id: product.id, name: product.name, sku: null },
      })
    })
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add to inventory</DialogTitle>
        <DialogDescription className="font-mono text-xs">{barcode}</DialogDescription>
      </DialogHeader>
      <div className="rounded-xl bg-brand-green/5 border border-brand-green/20 p-3">
        <p className="font-semibold text-brand-charcoal">{product.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {[product.brand, product.size].filter(Boolean).join(' · ') || '—'}
          {' · current stock '}
          <span className="font-bold">{product.inventory_quantity}</span>
        </p>
      </div>
      <form onSubmit={handleAdd} className="space-y-3 pt-1">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="rs-qty">Quantity *</Label>
            <Input
              id="rs-qty"
              type="number"
              min="1"
              step="1"
              required
              autoFocus
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rs-cost">Unit cost</Label>
            <Input
              id="rs-cost"
              type="number"
              min="0"
              step="0.01"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rs-exp">Expiration date (optional)</Label>
          <Input
            id="rs-exp"
            type="date"
            value={expiration}
            onChange={(e) => setExpiration(e.target.value)}
          />
        </div>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4" /> Receive
              </>
            )}
          </Button>
        </div>
      </form>
    </>
  )
}

// ── New product (from scan) sheet ───────────────────────────────

function NewProductSheet({
  sessionId,
  barcode,
  autofill,
  categories,
  pending,
  startTransition,
  onSuccess,
  onCancel,
}: {
  sessionId: string
  barcode: string
  autofill: NonNullable<LookupResponse['product']> | null
  categories: Category[]
  pending: boolean
  startTransition: React.TransitionStartFunction
  onSuccess: (lot: InventoryLot & { product: { id: string; name: string; sku: string | null } | null }) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(autofill?.name ?? '')
  const [brand, setBrand] = useState(autofill?.brand ?? '')
  const [size, setSize] = useState(autofill?.size ?? '')
  const [imageUrl, setImageUrl] = useState(autofill?.image_url ?? '')
  const [categoryId, setCategoryId] = useState('')
  const [wholesaleCost, setWholesaleCost] = useState('')
  const [retailPrice, setRetailPrice] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [expiration, setExpiration] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const qty = parseInt(quantity, 10)
    const cost = parseFloat(wholesaleCost || '0')
    const price = parseFloat(retailPrice || '0')

    startTransition(async () => {
      const res = await createProductAndReceive({
        session_id: sessionId,
        barcode,
        name,
        brand: brand || null,
        size: size || null,
        image_url: imageUrl || null,
        description: autofill?.description ?? null,
        category_id: categoryId || null,
        wholesale_cost: cost,
        retail_price: price,
        quantity: qty,
        expiration_date: expiration || null,
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      const total = qty * cost
      onSuccess({
        id: 'temp-' + res.product_id,
        product_id: res.product_id!,
        supplier_id: null,
        receiving_session_id: sessionId,
        quantity_received: qty,
        quantity_remaining: qty,
        unit_cost: cost,
        total_cost: total,
        lot_number: null,
        expiration_date: expiration || null,
        received_at: new Date().toISOString(),
        notes: null,
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        product: { id: res.product_id!, name, sku: null },
      })
    })
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>New product</DialogTitle>
        <DialogDescription>
          <span className="font-mono text-xs">{barcode}</span>
          {autofill ? ' · autofilled from Open Food Facts' : ' · not in catalog yet'}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
        <div className="space-y-1.5">
          <Label htmlFor="np-name">Name *</Label>
          <Input
            id="np-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Doritos Nacho Cheese 2.75oz"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="np-brand">Brand</Label>
            <Input
              id="np-brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="np-size">Size</Label>
            <Input
              id="np-size"
              value={size}
              onChange={(e) => setSize(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="np-category">Category</Label>
          <select
            id="np-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">— Optional —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="np-cost">Unit cost *</Label>
            <Input
              id="np-cost"
              type="number"
              min="0"
              step="0.01"
              required
              value={wholesaleCost}
              onChange={(e) => setWholesaleCost(e.target.value)}
              placeholder="0.90"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="np-price">Retail price *</Label>
            <Input
              id="np-price"
              type="number"
              min="0"
              step="0.01"
              required
              value={retailPrice}
              onChange={(e) => setRetailPrice(e.target.value)}
              placeholder="2.49"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="np-qty">Quantity *</Label>
            <Input
              id="np-qty"
              type="number"
              min="1"
              step="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="np-exp">Expiration</Label>
            <Input
              id="np-exp"
              type="date"
              value={expiration}
              onChange={(e) => setExpiration(e.target.value)}
            />
          </div>
        </div>
        {imageUrl && (
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Image from Open Food Facts</p>
              <button
                type="button"
                onClick={() => setImageUrl('')}
                className="text-xs text-red-600 hover:underline inline-flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" /> Remove
              </button>
            </div>
          </div>
        )}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
        )}
        <div className="flex justify-end gap-2 pt-1 sticky bottom-0 bg-white pb-1">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Skip
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4" /> Create & receive
              </>
            )}
          </Button>
        </div>
      </form>
    </>
  )
}
