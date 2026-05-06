import { buildMetadata, serviceSchema } from '@/lib/seo/metadata'
import { JsonLd } from '@/components/seo/JsonLd'

export const metadata = buildMetadata({
  title: 'Office Refill Program — Snacks & Drinks for North Jersey Businesses',
  description:
    'Auto-refill snack and beverage delivery for offices, gyms, dealerships, and barbershops across North Jersey. Flexible plans starting at $99/mo.',
  path: '/office-refill',
})

export default function OfficeRefillLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={serviceSchema()} />
      {children}
    </>
  )
}
