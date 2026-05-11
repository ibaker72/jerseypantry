'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, Archive, Search, Camera, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils/format'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { BarcodeScanner } from '@/components/admin/BarcodeScanner'
import type { Product, Category } from '@/types'

interface LookupResponse {
  source: 'local' | 'off'
  found?: boolean
  existing_product?: { id: string; name: string; slug: string } | null
  product?: {
    name: string
    brand: string | null
    size: string | null
    image_url: string | null
    description: string | null
    categories: string | null
  }
}

interface ProductFormProps {
  product?: Product
  categories: Category[]
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter()
  const isEdit = !!product
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [lookupState, setLookupState] = useState<
    | { kind: 'idle' }
    | { kind: 'loading' }
    | { kind: 'duplicate'; productId: string; name: string }
    | { kind: 'autofilled'; name: string }
    | { kind: 'not_found' }
    | { kind: 'error'; message: string }
  >({ kind: 'idle' })
  const [form, setForm] = useState({
    name: product?.name ?? '',
    slug: product?.slug ?? '',
    description: product?.description ?? '',
    sku: product?.sku ?? '',
    barcode: product?.barcode ?? '',
    brand: product?.brand ?? '',
    size: product?.size ?? '',
    unit: product?.unit ?? '',
    image_url: product?.image_url ?? '',
    wholesale_cost: product?.wholesale_cost?.toString() ?? '0',
    retail_price: product?.retail_price?.toString() ?? '',
    compare_at_price: product?.compare_at_price?.toString() ?? '',
    inventory_quantity: product?.inventory_quantity?.toString() ?? '0',
    reorder_threshold: product?.reorder_threshold?.toString() ?? '5',
    category_id: product?.category_id ?? '',
    is_active: product?.is_active ?? true,
    is_featured: product?.is_featured ?? false,
    is_bundle: product?.is_bundle ?? false,
    shipping_eligible: product?.shipping_eligible ?? true,
    delivery_eligible: product?.delivery_eligible ?? true,
  })

  const set = (key: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleNameChange = (name: string) => {
    set('name', name)
    if (!isEdit) set('slug', slugify(name))
  }

  const runLookup = async (rawBarcode: string) => {
    const barcode = rawBarcode.trim()
    if (!barcode) return
    set('barcode', barcode)
    setLookupState({ kind: 'loading' })
    try {
      const res = await fetch(
        `/api/products/lookup?barcode=${encodeURIComponent(barcode)}`
      )
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setLookupState({
          kind: 'error',
          message: data.error ?? 'Lookup failed',
        })
        return
      }
      const data = (await res.json()) as LookupResponse

      if (data.source === 'local' && data.existing_product) {
        setLookupState({
          kind: 'duplicate',
          productId: data.existing_product.id,
          name: data.existing_product.name,
        })
        return
      }
      if (data.found && data.product) {
        const p = data.product
        setForm((f) => ({
          ...f,
          name: f.name || p.name,
          slug: f.slug || slugify(p.name),
          brand: f.brand || p.brand || '',
          size: f.size || p.size || '',
          image_url: f.image_url || p.image_url || '',
          description: f.description || p.description || '',
        }))
        setLookupState({ kind: 'autofilled', name: p.name })
        return
      }
      setLookupState({ kind: 'not_found' })
    } catch (err) {
      setLookupState({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Lookup failed',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()

    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description || null,
      sku: form.sku || null,
      barcode: form.barcode || null,
      brand: form.brand || null,
      size: form.size || null,
      unit: form.unit || null,
      image_url: form.image_url || null,
      wholesale_cost: parseFloat(form.wholesale_cost) || 0,
      retail_price: parseFloat(form.retail_price),
      compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
      inventory_quantity: parseInt(form.inventory_quantity) || 0,
      reorder_threshold: parseInt(form.reorder_threshold) || 5,
      category_id: form.category_id || null,
      is_active: form.is_active,
      is_featured: form.is_featured,
      is_bundle: form.is_bundle,
      shipping_eligible: form.shipping_eligible,
      delivery_eligible: form.delivery_eligible,
    }

    try {
      if (isEdit) {
        const { error } = await supabase.from('products').update(payload).eq('id', product!.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('products').insert(payload)
        if (error) throw error
      }
      router.push('/admin/products')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  const handleArchive = async () => {
    if (!isEdit || !confirm('Archive this product? It will no longer show publicly.')) return
    const supabase = createClient()
    await supabase.from('products').update({ is_active: false }).eq('id', product!.id)
    router.push('/admin/products')
    router.refresh()
  }

  return (
    <>
    <BarcodeScanner
      open={scannerOpen}
      onOpenChange={setScannerOpen}
      onDetected={(code) => {
        setScannerOpen(false)
        runLookup(code)
      }}
    />
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-5 rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-brand-charcoal border-b pb-3">Product Info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label>Product Name *</Label>
              <Input required value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Doritos Nacho Cheese 2.75oz" />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => set('slug', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>SKU</Label>
              <Input value={form.sku} onChange={(e) => set('sku', e.target.value)} placeholder="SNK-001" />
            </div>
            <div className="space-y-2">
              <Label>Brand</Label>
              <Input value={form.brand} onChange={(e) => set('brand', e.target.value)} placeholder="Doritos" />
            </div>
            <div className="space-y-2">
              <Label>Size / Weight</Label>
              <Input value={form.size} onChange={(e) => set('size', e.target.value)} placeholder="2.75 oz" />
            </div>
            <div className="space-y-2">
              <Label>Barcode</Label>
              <div className="flex gap-2">
                <Input
                  value={form.barcode}
                  onChange={(e) => set('barcode', e.target.value)}
                  placeholder="e.g. 028400090421"
                  inputMode="numeric"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={() => runLookup(form.barcode)}
                  disabled={!form.barcode || lookupState.kind === 'loading'}
                >
                  {lookupState.kind === 'loading' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={() => setScannerOpen(true)}
                  title="Scan with camera"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              {lookupState.kind === 'autofilled' && (
                <p className="text-xs text-green-700 inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Autofilled from Open Food Facts: {lookupState.name}
                </p>
              )}
              {lookupState.kind === 'duplicate' && (
                <p className="text-xs text-orange-700">
                  Already in catalog —{' '}
                  <a
                    href={`/admin/products/${lookupState.productId}`}
                    className="underline font-medium"
                  >
                    edit {lookupState.name}
                  </a>{' '}
                  instead.
                </p>
              )}
              {lookupState.kind === 'not_found' && (
                <p className="text-xs text-gray-500">
                  No match in Open Food Facts. Fill in details manually.
                </p>
              )}
              {lookupState.kind === 'error' && (
                <p className="text-xs text-red-600">{lookupState.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Input value={form.unit} onChange={(e) => set('unit', e.target.value)} placeholder="each" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Description</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Product Image</Label>
              <ImageUpload value={form.image_url} onChange={(url) => set('image_url', url)} />
              <p className="text-xs text-gray-400">Or paste a URL directly:</p>
              <Input value={form.image_url} onChange={(e) => set('image_url', e.target.value)} placeholder="https://..." type="url" />
            </div>
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="space-y-5">
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-brand-charcoal border-b pb-3">Pricing</h2>
            <div className="space-y-2">
              <Label>Retail Price *</Label>
              <Input required type="number" step="0.01" min="0" value={form.retail_price} onChange={(e) => set('retail_price', e.target.value)} placeholder="2.49" />
            </div>
            <div className="space-y-2">
              <Label>Compare At Price</Label>
              <Input type="number" step="0.01" min="0" value={form.compare_at_price} onChange={(e) => set('compare_at_price', e.target.value)} placeholder="3.49" />
            </div>
            <div className="space-y-2">
              <Label>Wholesale Cost</Label>
              <Input type="number" step="0.01" min="0" value={form.wholesale_cost} onChange={(e) => set('wholesale_cost', e.target.value)} placeholder="0.90" />
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-brand-charcoal border-b pb-3">Inventory</h2>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" min="0" value={form.inventory_quantity} onChange={(e) => set('inventory_quantity', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Reorder Threshold</Label>
              <Input type="number" min="0" value={form.reorder_threshold} onChange={(e) => set('reorder_threshold', e.target.value)} />
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-brand-charcoal border-b pb-3">Category & Settings</h2>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category_id} onValueChange={(v) => set('category_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              {[
                { key: 'is_active', label: 'Active (visible to public)' },
                { key: 'is_featured', label: 'Featured product' },
                { key: 'is_bundle', label: 'Is a bundle' },
                { key: 'shipping_eligible', label: 'Shipping eligible' },
                { key: 'delivery_eligible', label: 'Delivery eligible' },
              ].map((toggle) => (
                <label key={toggle.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form[toggle.key as keyof typeof form] as boolean}
                    onChange={(e) => set(toggle.key, e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">{toggle.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> {isEdit ? 'Save Changes' : 'Create Product'}</>}
        </Button>
        {isEdit && (
          <Button type="button" size="lg" variant="outline" onClick={handleArchive}>
            <Archive className="h-4 w-4" /> Archive
          </Button>
        )}
      </div>
    </form>
    </>
  )
}
