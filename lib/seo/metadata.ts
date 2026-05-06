import type { Metadata } from 'next'

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mycornerstore.com'
export const SITE_NAME = 'My Corner Store'
export const SITE_DESCRIPTION =
  'Snacks, drinks, household essentials, and local favorites delivered same-day around North Jersey.'

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`

export function buildMetadata({
  title,
  description = SITE_DESCRIPTION,
  path = '',
  image = DEFAULT_OG_IMAGE,
  noIndex = false,
}: {
  title?: string
  description?: string
  path?: string
  image?: string
  noIndex?: boolean
}): Metadata {
  const canonical = `${SITE_URL}${path}`
  const resolvedTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Your corner store, online.`

  return {
    title: resolvedTitle,
    description,
    alternates: { canonical },
    robots: noIndex ? { index: false } : { index: true, follow: true },
    openGraph: {
      title: resolvedTitle,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: 'website',
      images: [{ url: image, width: 1200, height: 630, alt: resolvedTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: resolvedTitle,
      description,
      images: [image],
    },
  }
}

// JSON-LD helpers

export function localBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    telephone: '+1-973-555-0100',
    email: 'hello@mycornerstore.com',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Passaic',
      addressRegion: 'NJ',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 40.8568,
      longitude: -74.1288,
    },
    areaServed: [
      { '@type': 'City', name: 'Passaic', containedInPlace: { '@type': 'State', name: 'New Jersey' } },
      { '@type': 'City', name: 'Clifton', containedInPlace: { '@type': 'State', name: 'New Jersey' } },
      { '@type': 'City', name: 'Paterson', containedInPlace: { '@type': 'State', name: 'New Jersey' } },
      { '@type': 'City', name: 'Rutherford', containedInPlace: { '@type': 'State', name: 'New Jersey' } },
      { '@type': 'City', name: 'East Rutherford', containedInPlace: { '@type': 'State', name: 'New Jersey' } },
      { '@type': 'City', name: 'Lyndhurst', containedInPlace: { '@type': 'State', name: 'New Jersey' } },
    ],
    servesCuisine: null,
    priceRange: '$',
    openingHours: 'Mo-Su 07:00-22:00',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Corner Store Products',
      itemListElement: [
        { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Snacks & Chips' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Drinks & Beverages' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Household Essentials' } },
      ],
    },
  }
}

export function productSchema({
  name,
  description,
  price,
  image,
  slug,
  inStock,
  brand,
}: {
  name: string
  description: string | null
  price: number
  image: string | null
  slug: string
  inStock: boolean
  brand?: string | null
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: description ?? undefined,
    image: image ?? undefined,
    brand: brand ? { '@type': 'Brand', name: brand } : undefined,
    url: `${SITE_URL}/shop/${slug}`,
    offers: {
      '@type': 'Offer',
      price: price.toFixed(2),
      priceCurrency: 'USD',
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `${SITE_URL}/shop/${slug}`,
      seller: { '@type': 'Organization', name: SITE_NAME },
    },
  }
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function serviceSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Office Refill Program',
    description:
      'Recurring snack and beverage delivery for North Jersey businesses. Auto-refill subscriptions for offices, gyms, dealerships, and more.',
    provider: { '@type': 'LocalBusiness', name: SITE_NAME, url: SITE_URL },
    areaServed: { '@type': 'State', name: 'New Jersey' },
    serviceType: 'Office Beverage & Snack Delivery',
    offers: [
      { '@type': 'Offer', name: 'Starter Refill', price: '99.00', priceCurrency: 'USD' },
      { '@type': 'Offer', name: 'Standard Refill', price: '199.00', priceCurrency: 'USD' },
      { '@type': 'Offer', name: 'Premium Refill', price: '399.00', priceCurrency: 'USD' },
    ],
  }
}
