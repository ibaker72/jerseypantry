import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe/client'
import type { B2BPlan, B2BBillingType } from '@/types'

// Stripe Price IDs are configured per-plan via env vars.
// Set STRIPE_B2B_STARTER_PRICE_ID, _STANDARD_, _PREMIUM_ in your .env
function getPriceId(plan: B2BPlan): string | null {
  const map: Record<B2BPlan, string> = {
    starter:  process.env.STRIPE_B2B_STARTER_PRICE_ID  ?? '',
    standard: process.env.STRIPE_B2B_STANDARD_PRICE_ID ?? '',
    premium:  process.env.STRIPE_B2B_PREMIUM_PRICE_ID  ?? '',
  }
  return map[plan] || null
}

const PLAN_PRICES: Record<B2BPlan, number> = { starter: 9900, standard: 19900, premium: 39900 }
const PLAN_NAMES:  Record<B2BPlan, string> = {
  starter: 'Starter Refill ($99/mo)',
  standard: 'Standard Refill ($199/mo)',
  premium: 'Premium Refill ($399/mo)',
}

export async function POST(req: NextRequest) {
  const serverClient = await createClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in to subscribe' }, { status: 401 })

  const body = await req.json()
  const {
    plan,
    billing_type = 'card',
    business_name,
    contact_name,
    contact_phone,
    business_type,
  }: {
    plan: B2BPlan
    billing_type?: B2BBillingType
    business_name: string
    contact_name?: string
    contact_phone?: string
    business_type?: string
  } = body

  if (!plan || !business_name) {
    return NextResponse.json({ error: 'plan and business_name required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const stripe = getStripe()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  // Create or retrieve Stripe customer
  let stripeCustomerId: string
  const { data: existingBA } = await supabase
    .from('business_accounts')
    .select('id, stripe_customer_id')
    .eq('contact_email', user.email)
    .single()

  if (existingBA?.stripe_customer_id) {
    stripeCustomerId = existingBA.stripe_customer_id
  } else {
    const customer = await stripe.customers.create({
      email: user.email!,
      name: business_name,
      metadata: { user_id: user.id, plan, business_type: business_type ?? '' },
    })
    stripeCustomerId = customer.id
  }

  const priceId = getPriceId(plan)

  // If Stripe price IDs are configured, use Stripe Checkout in subscription mode
  if (priceId) {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        user_id: user.id,
        plan,
        billing_type,
        business_name,
        contact_name: contact_name ?? '',
        contact_phone: contact_phone ?? '',
        business_type: business_type ?? '',
        b2b: 'true',
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan,
          business_name,
        },
        ...(billing_type === 'net30' ? { payment_settings: { payment_method_types: ['us_bank_account'] } } : {}),
      },
      success_url: `${siteUrl}/b2b/dashboard?subscribed=1`,
      cancel_url: `${siteUrl}/office-refill?canceled=1`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    })
    return NextResponse.json({ url: session.url })
  }

  // Fallback: no Stripe Price IDs configured — create a pending account and charge
  // via a one-time Stripe Checkout (useful for development / manual billing)
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer: stripeCustomerId,
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: PLAN_NAMES[plan], description: 'Monthly Office Refill Plan' },
        unit_amount: PLAN_PRICES[plan],
      },
      quantity: 1,
    }],
    metadata: {
      user_id: user.id,
      plan,
      billing_type,
      business_name,
      contact_name: contact_name ?? '',
      contact_phone: contact_phone ?? '',
      business_type: business_type ?? '',
      b2b: 'true',
    },
    success_url: `${siteUrl}/b2b/dashboard?subscribed=1`,
    cancel_url: `${siteUrl}/office-refill?canceled=1`,
    billing_address_collection: 'required',
  })

  return NextResponse.json({ url: session.url })
}
