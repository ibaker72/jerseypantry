'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, Loader2, Pause, Play } from 'lucide-react'

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
}
interface WindowWithBD extends Window {
  BarcodeDetector?: BarcodeDetectorCtor
}

const SUPPORTED_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39']

// Persistent, embedded barcode scanner for the receiving page.
// Pauses itself after each detection so the parent can show a sheet;
// the parent calls `onResume` to re-arm. De-dupes identical codes within
// 2 seconds so a held barcode doesn't fire repeatedly.
export function InlineBarcodeScanner({
  onDetected,
  paused,
  onResume,
}: {
  onDetected: (barcode: string) => void
  paused: boolean
  onResume: () => void
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastCodeRef = useRef<{ code: string; ts: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [supported, setSupported] = useState<boolean | null>(null)
  const [starting, setStarting] = useState(false)
  const [manualCode, setManualCode] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const w = window as WindowWithBD
    setSupported(typeof w.BarcodeDetector === 'function')
  }, [])

  useEffect(() => {
    if (paused) return
    if (supported !== true) return

    let cancelled = false

    const start = async () => {
      setError(null)
      setStarting(true)
      try {
        if (!streamRef.current) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false,
          })
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop())
            return
          }
          streamRef.current = stream
        }
        const video = videoRef.current
        if (!video) return
        if (video.srcObject !== streamRef.current) {
          video.srcObject = streamRef.current
        }
        await video.play().catch(() => {})

        const w = window as WindowWithBD
        const detector = new w.BarcodeDetector!({ formats: SUPPORTED_FORMATS })

        const tick = async () => {
          if (cancelled || paused) return
          if (video.readyState >= 2) {
            try {
              const results = await detector.detect(video)
              if (results.length > 0) {
                const raw = results[0].rawValue.replace(/[^0-9]/g, '')
                if (raw.length >= 6) {
                  const now = Date.now()
                  const last = lastCodeRef.current
                  if (!last || last.code !== raw || now - last.ts > 2000) {
                    lastCodeRef.current = { code: raw, ts: now }
                    onDetected(raw)
                    return
                  }
                }
              }
            } catch {
              // transient
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
    }
  }, [paused, supported, onDetected])

  // Stop camera when component unmounts.
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [])

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault()
    const code = manualCode.replace(/[^0-9]/g, '')
    if (code.length < 6) return
    onDetected(code)
    setManualCode('')
  }

  return (
    <div className="space-y-2">
      {supported === false ? (
        <div className="rounded-xl bg-orange-50 border border-orange-100 p-3 text-xs text-orange-700">
          Camera scanning not supported on this browser — use manual entry below.
        </div>
      ) : (
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            muted
            playsInline
          />
          <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 h-0.5 bg-brand-orange/80 pointer-events-none" />
          <div className="absolute top-2 right-2 flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full bg-black/60 text-white">
            {paused ? (
              <>
                <Pause className="h-3 w-3" /> Paused
              </>
            ) : (
              <>
                <Camera className="h-3 w-3" /> Scanning…
              </>
            )}
          </div>
          {starting && (
            <div className="absolute inset-0 flex items-center justify-center text-white bg-black/40">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          {paused && (
            <button
              type="button"
              onClick={onResume}
              className="absolute inset-0 flex items-center justify-center bg-black/60 text-white"
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-orange px-4 py-2 text-sm font-semibold">
                <Play className="h-4 w-4" /> Resume scanning
              </span>
            </button>
          )}
        </div>
      )}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
      )}
      <form onSubmit={submitManual} className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder="…or type a barcode"
          className="flex-1 h-10 px-3 rounded-xl border border-gray-200 text-sm"
        />
        <button
          type="submit"
          className="h-10 px-4 rounded-xl bg-brand-charcoal text-white text-sm font-semibold disabled:opacity-50"
          disabled={manualCode.replace(/[^0-9]/g, '').length < 6}
        >
          Enter
        </button>
      </form>
    </div>
  )
}
