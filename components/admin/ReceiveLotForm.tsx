'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, PackagePlus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { receiveLot } from '@/lib/actions/inventory-lots'
import type { Product, Supplier } from '@/types'

interface Props {
  products: Pick<Product, 'id' | 'name' | 'sku' | 'brand' | 'inventory_quantity'>[]
  suppliers: Pick<Supplier, 'id' | 'name'>[]
}

export function ReceiveLotForm({ products, suppliers }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [productId, setProductId] = useState('')
  const [productQuery, setProductQuery] = useState('')
  const [supplierId, setSupplierId] = useState<string>('')
  const [quantity, setQuantity] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [lotNumber, setLotNumber] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [notes, setNotes] = useState('')

  const productMatches = useMemo(() => {
    const q = productQuery.trim().toLowerCase()
    if (!q) return products.slice(0, 8)
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku ?? '').toLowerCase().includes(q) ||
          (p.brand ?? '').toLowerCase().includes(q)
      )
      .slice(0, 8)
  }, [productQuery, products])

  const selectedProduct = products.find((p) => p.id === productId) ?? null

  const reset = () => {
    setProductId('')
    setProductQuery('')
    setSupplierId('')
    setQuantity('')
    setUnitCost('')
    setLotNumber('')
    setExpirationDate('')
    setNotes('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!productId) {
      setError('Pick a product first')
      return
    }
    const qty = parseInt(quantity, 10)
    const cost = parseFloat(unitCost || '0')

    startTransition(async () => {
      const res = await receiveLot({
        product_id: productId,
        supplier_id: supplierId || null,
        quantity: qty,
        unit_cost: cost,
        lot_number: lotNumber.trim() || null,
        expiration_date: expirationDate || null,
        notes: notes.trim() || null,
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setSuccess(
        `Received ${qty} × ${selectedProduct?.name ?? 'item'}. Stock updated.`
      )
      reset()
      router.refresh()
    })
  }

  const total = (() => {
    const q = parseInt(quantity, 10)
    const c = parseFloat(unitCost || '0')
    if (!Number.isFinite(q) || !Number.isFinite(c)) return 0
    return q * c
  })()

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-brand-charcoal border-b pb-3">
          Shipment details
        </h2>

        <div className="space-y-1.5">
          <Label htmlFor="rl-product">Product *</Label>
          {selectedProduct ? (
            <div className="flex items-center justify-between rounded-xl border border-brand-green/30 bg-brand-green/5 px-3 py-2">
              <div>
                <p className="font-medium text-brand-charcoal">{selectedProduct.name}</p>
                <p className="text-xs text-gray-500">
                  {selectedProduct.brand ? `${selectedProduct.brand} · ` : ''}
                  Current stock: {selectedProduct.inventory_quantity}
                </p>
              </div>
              <button
                type="button"
                className="text-xs text-gray-500 hover:text-brand-green"
                onClick={() => {
                  setProductId('')
                  setProductQuery('')
                }}
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="rl-product"
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  placeholder="Search by name, SKU, or brand…"
                  className="pl-9"
                />
              </div>
              {productMatches.length > 0 && (
                <ul className="rounded-xl border border-gray-200 divide-y divide-gray-100 max-h-60 overflow-y-auto bg-white">
                  {productMatches.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setProductId(p.id)
                          setProductQuery('')
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50"
                      >
                        <p className="text-sm font-medium text-brand-charcoal">{p.name}</p>
                        <p className="text-xs text-gray-500">
                          {p.sku ? `SKU ${p.sku} · ` : ''}stock {p.inventory_quantity}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rl-supplier">Supplier</Label>
          <select
            id="rl-supplier"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">— Optional —</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="rl-qty">Quantity *</Label>
            <Input
              id="rl-qty"
              type="number"
              min="1"
              step="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="24"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rl-cost">Unit cost</Label>
            <Input
              id="rl-cost"
              type="number"
              min="0"
              step="0.01"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              placeholder="0.90"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Total</Label>
            <div className="h-10 flex items-center px-3 rounded-xl bg-gray-50 border border-gray-100 text-sm font-medium text-brand-charcoal">
              ${total.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="rl-lot">Lot / batch #</Label>
            <Input
              id="rl-lot"
              value={lotNumber}
              onChange={(e) => setLotNumber(e.target.value)}
              placeholder="optional"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rl-exp">Expiration date</Label>
            <Input
              id="rl-exp"
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rl-notes">Notes</Label>
          <Textarea
            id="rl-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Picked up at Restaurant Depot · case of 24"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{error}</p>
      )}
      {success && (
        <div className="text-sm text-green-700 bg-green-50 rounded-xl px-4 py-2 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          {success}
        </div>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <PackagePlus className="h-4 w-4" />
            Receive shipment
          </>
        )}
      </Button>
    </form>
  )
}
