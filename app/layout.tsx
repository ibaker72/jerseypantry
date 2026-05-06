import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/components/cart/CartContext'
import { Header } from '@/components/site/Header'
import { Footer } from '@/components/site/Footer'
import { ToastProvider, ToastViewport } from '@/components/ui/toast'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: {
    default: 'My Corner Store — Your corner store, online.',
    template: '%s | My Corner Store',
  },
  description:
    'Snacks, drinks, household essentials, and local favorites delivered same-day around North Jersey.',
  keywords: ['corner store', 'local delivery', 'North Jersey', 'snacks', 'drinks', 'household essentials'],
  openGraph: {
    title: 'My Corner Store',
    description: 'Your corner store, online.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col bg-[#FAF8F3]">
        <ToastProvider>
          <CartProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </CartProvider>
          <ToastViewport />
        </ToastProvider>
      </body>
    </html>
  )
}
