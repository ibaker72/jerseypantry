'use client'

import { useToast } from './use-toast'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastTitle,
  ToastViewport,
} from './toast'

export function Toaster() {
  const { toasts } = useToast()
  return (
    <>
      {toasts.map(({ id, title, description, variant, open }) => (
        <Toast key={id} open={open} variant={variant}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </>
  )
}
