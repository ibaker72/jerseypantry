import { buildMetadata, serviceSchema } from '@/lib/seo/metadata'
import { JsonLd } from '@/components/seo/JsonLd'

export const metadata = buildMetadata({
  title: 'Wholesale — Tier-2 Pricing for North Jersey Bodegas, Offices & Cafés',
  description:
    'Buy at wholesale from a digital middleman with live inventory, no minimums, and same-day delivery across North Jersey. Apply for an account or subscribe to a recurring bundle.',
  path: '/wholesale',
})

export default function WholesaleLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={serviceSchema()} />
      {children}
    </>
  )
}
