import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe/client'

// Returns a Stripe Customer Portal URL for the current user's business account
export async function POST(req: NextRequest) {
  const serverClient = await createClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  // Find the user's business account
  const { data: member } = await supabase
    .from('business_members')
    .select('business_id, business_accounts(stripe_customer_id)')
    .eq('user_id', user.id)
    .single()

  const stripeCustomerId = (member?.business_accounts as unknown as { stripe_customer_id: string | null } | null)?.stripe_customer_id

  if (!stripeCustomerId) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 404 })
  }

  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${siteUrl}/b2b/billing`,
  })

  return NextResponse.json({ url: session.url })
}
