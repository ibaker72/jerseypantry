'use client'

import { useState, useEffect } from 'react'

export type ToastVariant = 'default' | 'destructive'

export interface ToastMessage {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
  open: boolean
}

type ToastInput = Omit<ToastMessage, 'id' | 'open'>

let _count = 0
const _listeners: Array<(toasts: ToastMessage[]) => void> = []
let _state: ToastMessage[] = []

function _setState(toasts: ToastMessage[]) {
  _state = toasts
  _listeners.forEach((fn) => fn(toasts))
}

export function toast(input: ToastInput) {
  const id = `t${++_count}`
  _setState([..._state, { ...input, id, open: true }].slice(-5))
  setTimeout(() => {
    _setState(_state.map((t) => (t.id === id ? { ...t, open: false } : t)))
    setTimeout(() => _setState(_state.filter((t) => t.id !== id)), 400)
  }, 3500)
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>(_state)
  useEffect(() => {
    _listeners.push(setToasts)
    return () => {
      const i = _listeners.indexOf(setToasts)
      if (i > -1) _listeners.splice(i, 1)
    }
  }, [])
  return { toasts }
}
