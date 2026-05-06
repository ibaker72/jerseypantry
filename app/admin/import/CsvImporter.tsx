'use client'

import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { Upload, FileText, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { productImportRowSchema } from '@/lib/validators/cart'
import type { Category } from '@/types'
import type { ProductImportRow } from '@/lib/validators/cart'

interface ParsedRow {
  row: number
  data: ProductImportRow
  errors: string[]
  valid: boolean
}

interface CsvImporterProps {
  categories: Category[]
}

const REQUIRED_COLUMNS = ['name', 'category', 'sku', 'wholesale_cost', 'retail_price', 'inventory_quantity']
const EXAMPLE_CSV = `name,category,sku,wholesale_cost,retail_price,inventory_quantity,description,brand,size,shipping_eligible,delivery_eligible,reorder_threshold
Doritos Nacho Cheese 2.75oz,Chips & Salty Snacks,SNK-001,0.90,2.49,150,Bold nacho cheese tortilla chips,Doritos,2.75 oz,true,true,25
Poland Spring Water 16.9oz,Drinks,DRK-001,0.65,1.49,200,Natural spring water,Poland Spring,16.9 fl oz,true,true,30`

export function CsvImporter({ categories }: CsvImporterProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [csvText, setCsvText] = useState('')
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ success: number; errors: number } | null>(null)
  const [parseError, setParseError] = useState('')

  const categoryMap = Object.fromEntries(categories.map((c) => [c.name.toLowerCase(), c.id]))

  const parseCsv = (text: string) => {
    setParseError('')
    setResult(null)
    const { data, errors } = Papa.parse<Record<string, string>>(text.trim(), {
      header: true,
      skipEmptyLines: true,
    })

    if (errors.length && data.length === 0) {
      setParseError('CSV parse error: ' + errors[0]?.message)
      setRows([])
      return
    }

    if (data.length === 0) {
      setParseError('No rows found in CSV.')
      setRows([])
      return
    }

    // Check required columns
    const headers = Object.keys(data[0] ?? {})
    const missing = REQUIRED_COLUMNS.filter((c) => !headers.includes(c))
    if (missing.length) {
      setParseError(`Missing required columns: ${missing.join(', ')}`)
      setRows([])
      return
    }

    const parsed: ParsedRow[] = data.map((raw, i) => {
      const result = productImportRowSchema.safeParse(raw)
      if (result.success) {
        return { row: i + 2, data: result.data, errors: [], valid: true }
      }
      return {
        row: i + 2,
        data: raw as unknown as ProductImportRow,
        errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
        valid: false,
      }
    })

    setRows(parsed)
  }

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setCsvText(text)
      parseCsv(text)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    const validRows = rows.filter((r) => r.valid)
    if (validRows.length === 0) return

    setImporting(true)
    let successCount = 0
    let errorCount = 0

    try {
      const res = await fetch('/api/admin/import-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: validRows.map((r) => r.data),
          category_map: categoryMap,
        }),
      })
      const data = await res.json()
      successCount = data.success ?? 0
      errorCount = data.errors ?? 0
    } catch {
      errorCount = validRows.length
    }

    setResult({ success: successCount, errors: errorCount })
    setImporting(false)
  }

  const validCount = rows.filter((r) => r.valid).length
  const invalidCount = rows.filter((r) => !r.valid).length

  return (
    <div className="space-y-6">
      {/* Upload area */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-brand-charcoal mb-4">Upload CSV File</h2>
        <div
          className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-brand-green transition-colors cursor-pointer"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const file = e.dataTransfer.files[0]
            if (file) handleFile(file)
          }}
        >
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-600">Drop a CSV file here or click to browse</p>
          <p className="text-xs text-gray-400 mt-1">Accepts .csv files</p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
        </div>
      </div>

      {/* Paste CSV */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-brand-charcoal mb-4">Or Paste CSV</h2>
        <Textarea
          rows={8}
          placeholder={EXAMPLE_CSV}
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          className="font-mono text-xs"
        />
        <div className="flex gap-3 mt-3">
          <Button variant="outline" onClick={() => { setCsvText(EXAMPLE_CSV); parseCsv(EXAMPLE_CSV) }}>
            Load Example
          </Button>
          <Button onClick={() => parseCsv(csvText)} disabled={!csvText.trim()}>
            <FileText className="h-4 w-4" /> Parse CSV
          </Button>
        </div>
      </div>

      {/* Required columns */}
      <div className="rounded-2xl bg-brand-cream border border-gray-100 p-5">
        <p className="text-xs font-semibold text-gray-600 mb-2">Required columns:</p>
        <div className="flex flex-wrap gap-2">
          {REQUIRED_COLUMNS.map((c) => (
            <code key={c} className="text-xs bg-white border border-gray-200 rounded px-2 py-0.5 text-brand-charcoal">{c}</code>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">Optional: description, image_url, barcode, brand, size, unit, shipping_eligible, delivery_eligible, reorder_threshold</p>
      </div>

      {/* Parse error */}
      {parseError && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {parseError}
        </div>
      )}

      {/* Preview */}
      {rows.length > 0 && (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-brand-charcoal">
              Preview — {rows.length} row{rows.length !== 1 ? 's' : ''}
            </h2>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-green-700">
                <CheckCircle className="h-4 w-4" /> {validCount} valid
              </span>
              {invalidCount > 0 && (
                <span className="flex items-center gap-1 text-red-600">
                  <XCircle className="h-4 w-4" /> {invalidCount} invalid
                </span>
              )}
            </div>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">Row</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">Name</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">SKU</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">Category</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-500">Price</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-500">Qty</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((row) => (
                  <tr key={row.row} className={row.valid ? '' : 'bg-red-50'}>
                    <td className="px-3 py-2 text-gray-400">{row.row}</td>
                    <td className="px-3 py-2 text-brand-charcoal">{String(row.data.name ?? '')}</td>
                    <td className="px-3 py-2 font-mono text-gray-500">{String(row.data.sku ?? '')}</td>
                    <td className="px-3 py-2 text-gray-500">{String(row.data.category ?? '')}</td>
                    <td className="px-3 py-2 text-right">${Number(row.data.retail_price ?? 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{String(row.data.inventory_quantity ?? 0)}</td>
                    <td className="px-3 py-2">
                      {row.valid ? (
                        <span className="text-green-700 font-medium">✓ Valid</span>
                      ) : (
                        <span className="text-red-600" title={row.errors.join(', ')}>✗ {row.errors[0]?.slice(0, 40)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {validCount > 0 && !result && (
            <div className="px-5 py-4 border-t">
              <Button onClick={handleImport} disabled={importing} size="lg">
                {importing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Importing…</>
                ) : (
                  <>Import {validCount} Product{validCount !== 1 ? 's' : ''}</>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="rounded-2xl bg-green-50 border border-green-100 p-6">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="font-semibold text-green-800">Import complete!</p>
          </div>
          <p className="text-sm text-green-700">{result.success} product{result.success !== 1 ? 's' : ''} imported successfully.</p>
          {result.errors > 0 && (
            <p className="text-sm text-red-600 mt-1">{result.errors} row{result.errors !== 1 ? 's' : ''} failed to import.</p>
          )}
        </div>
      )}
    </div>
  )
}
