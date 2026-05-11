'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, Loader2, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

// BarcodeDetector isn't in TypeScript's default DOM lib yet.
interface DetectedBarcode {
  rawValue: string
  format: string
}
interface BarcodeDetectorOptions {
  formats?: string[]
}
interface BarcodeDetectorInstance {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>
}
type BarcodeDetectorCtor = {
  new (options?: BarcodeDetectorOptions): BarcodeDetectorInstance
  getSupportedFormats?: () => Promise<string[]>
}

interface WindowWithBD extends Window {
  BarcodeDetector?: BarcodeDetectorCtor
}

const SUPPORTED_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39']

export function BarcodeScanner({
  open,
  onOpenChange,
  onDetected,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDetected: (barcode: string) => void
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [supported, setSupported] = useState<boolean | null>(null)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const w = window as WindowWithBD
    setSupported(typeof w.BarcodeDetector === 'function')
  }, [])

  useEffect(() => {
    if (!open) return
    if (!supported) return

    let cancelled = false

    const start = async () => {
      setError(null)
      setStarting(true)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()

        const w = window as WindowWithBD
        const detector = new w.BarcodeDetector!({ formats: SUPPORTED_FORMATS })

        const tick = async () => {
          if (cancelled) return
          if (video.readyState >= 2) {
            try {
              const results = await detector.detect(video)
              if (results.length > 0) {
                const raw = results[0].rawValue.replace(/[^0-9]/g, '')
                if (raw.length >= 6) {
                  onDetected(raw)
                  return
                }
              }
            } catch {
              // Detector can throw transient errors — keep scanning.
            }
          }
          rafRef.current = requestAnimationFrame(tick)
        }
        tick()
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Could not start camera. Check browser permissions.'
        )
      } finally {
        setStarting(false)
      }
    }

    start()

    return () => {
      cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [open, supported, onDetected])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scan barcode</DialogTitle>
          <DialogDescription>
            Point your camera at the product&apos;s UPC.
          </DialogDescription>
        </DialogHeader>

        {supported === false ? (
          <div className="rounded-xl bg-orange-50 border border-orange-100 p-4 text-sm text-orange-700">
            <p className="font-semibold mb-1">Camera scanning isn&apos;t supported here.</p>
            <p>
              Use Chrome or Edge on Android, or just type the barcode by hand —
              the lookup works either way.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                muted
                playsInline
              />
              <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-brand-orange/80 pointer-events-none" />
              {starting && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">
                {error}
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" /> Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ScanButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick}>
      <Camera className="h-4 w-4" /> Scan
    </Button>
  )
}
