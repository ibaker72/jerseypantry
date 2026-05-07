import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/components/cart/CartContext'
import { Header } from '@/components/site/Header'
import { Footer } from '@/components/site/Footer'
import { MobileCartBar } from '@/components/site/MobileCartBar'
import { ToastProvider, ToastViewport } from '@/components/ui/toast'
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, DEFAULT_OG_IMAGE } from '@/lib/seo/metadata'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Your corner store, online.`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'corner store', 'local delivery', 'North Jersey delivery', 'same-day delivery NJ',
    'snacks', 'drinks', 'household essentials', 'Passaic NJ', 'Clifton NJ', 'Paterson NJ',
    'office snacks North Jersey', 'convenience store delivery',
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  openGraph: {
    title: `${SITE_NAME} — Your corner store, online.`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: 'website',
    locale: 'en_US',
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Your corner store, online.`,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col bg-[#FAF8F3]" suppressHydrationWarning>
        <ToastProvider>
          <CartProvider>
            <Header />
            <main className="flex-1 pb-20 lg:pb-0">{children}</main>
            <Footer />
            <MobileCartBar />
          </CartProvider>
          <ToastViewport />
        </ToastProvider>
      </body>
    </html>
  )
}
