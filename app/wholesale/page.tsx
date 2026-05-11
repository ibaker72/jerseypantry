'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Warehouse,
  Boxes,
  Truck,
  Repeat,
  ArrowRight,
  CheckCircle,
  Store,
  Building2,
  Loader2,
  Zap,
  DollarSign,
  Clock,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const PILLARS = [
  {
    icon: Warehouse,
    title: 'Virtual Warehouse',
    desc: 'We list live stock from North Jersey wholesalers. You order, we pick up just-in-time. No dead inventory, no minimums.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: DollarSign,
    title: 'Tier-2 Pricing',
    desc: 'Logged-in business accounts unlock wholesale pricing — below retail, above true wholesale. A fair middle for small shops.',
    color: 'bg-emerald-50 text-brand-green',
  },
  {
    icon: Truck,
    title: 'Same-Day Logistics',
    desc: 'Self-delivery for nearby stops, DoorDash / Uber for the rest. Last-mile fulfillment legacy wholesalers can’t match.',
    color: 'bg-sky-50 text-sky-600',
  },
  {
    icon: Repeat,
    title: 'Subscription Bundles',
    desc: 'Curated boxes on a recurring schedule. Set it up once — we restock on your cadence, every week or every month.',
    color: 'bg-orange-50 text-brand-orange',
  },
]

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Apply for an Account',
    desc: 'Tell us about your business — office, bodega, gym, salon, dealership. We approve most accounts within 24 hours.',
  },
  {
    step: '2',
    title: 'Browse Wholesale Catalog',
    desc: 'Once approved, log in and see Tier-2 prices on every product. Bulk packaging, weights, and same-day availability included.',
  },
  {
    step: '3',
    title: 'Order or Subscribe',
    desc: 'Place one-off bulk orders, or set a recurring delivery. We aggregate orders, pick up from the wholesaler, and deliver same-day.',
  },
]

const OFFICE_PERKS = [
  'Curated snack & drink mixes by industry',
  'Weekly or bi-weekly recurring delivery',
  'Net-30 invoicing available',
  'Dedicated account rep',
  'Cancel or pause anytime',
]

const RETAILER_PERKS = [
  'Below-retail pricing for licensed shops',
  'Lower minimums than big distributors',
  'Mix-and-match across SKUs and brands',
  'Live availability — no “out of stock” surprises',
  'Local pickup or same-day delivery',
]

const SUBSCRIPTION_BUNDLES = [
  {
    slug: 'starter' as const,
    name: 'Starter Refill',
    price: '$99',
    period: '/mo',
    items: 'Up to 50 items / month',
    cadence: 'Bi-weekly delivery',
    tagline: 'Small offices, waiting rooms, barbershops',
    bullets: ['Curated drinks & snacks mix', 'Dedicated rep', 'Cancel anytime'],
    highlight: false,
  },
  {
    slug: 'standard' as const,
    name: 'Standard Refill',
    price: '$199',
    period: '/mo',
    items: 'Up to 120 items / month',
    cadence: 'Weekly delivery',
    tagline: 'Gyms, dealerships, mid-size offices',
    bullets: ['Custom product selection', 'Priority support', 'Invoicing available'],
    highlight: true,
  },
  {
    slug: 'premium' as const,
    name: 'Premium Refill',
    price: '$399',
    period: '/mo',
    items: 'Unlimited items',
    cadence: '2× weekly delivery',
    tagline: 'Corporate suites, multi-location, large teams',
    bullets: ['Fully custom mix', 'Dedicated driver', 'Net-30 billing'],
    highlight: false,
  },
]

const BUSINESS_TYPES = [
  'Bodega / Corner Store',
  'Convenience Store',
  'Restaurant / Café',
  'Auto Dealership',
  'Barbershop / Salon',
  'Gym / Fitness Center',
  'Corporate Office',
  'Medical / Dental Office',
  'Other',
]

type PlanSlug = (typeof SUBSCRIPTION_BUNDLES)[number]['slug']

export default function WholesalePage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [subscribingPlan, setSubscribingPlan] = useState<PlanSlug | null>(null)
  const [subscribeError, setSubscribeError] = useState('')
  const [form, setForm] = useState({
    business_name: '',
    contact_name: '',
    email: '',
    phone: '',
    business_type: '',
    estimated_budget: '',
    message: '',
  })

  const handleSubscribe = async (planSlug: PlanSlug) => {
    setSubscribingPlan(planSlug)
    setSubscribeError('')
    try {
      const res = await fetch('/api/b2b/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planSlug,
          billing_type: 'card',
          business_name: form.business_name || 'New Wholesale Account',
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else if (res.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent('/wholesale')}`
      } else {
        setSubscribeError(data.error ?? 'Something went wrong')
      }
    } catch {
      setSubscribeError('Network error — please try again')
    } finally {
      setSubscribingPlan(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/office-refill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          message: `[Wholesale inquiry] ${form.message}`.trim(),
        }),
      })
      if (res.ok) setSubmitted(true)
    } catch {
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section className="relative bg-brand-navy text-white overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-brand-orange/10 blur-3xl -translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="grid lg:grid-cols-[1fr,380px] gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
                <Warehouse className="h-4 w-4 text-brand-orange" />
                Wholesale, Reimagined
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold mb-5 leading-tight">
                North Jersey&apos;s{' '}
                <span className="text-brand-orange">Digital Wholesale</span>{' '}
                Middleman.
              </h1>
              <p className="text-blue-100 max-w-xl leading-relaxed text-lg mb-8">
                We aggregate inventory from regional wholesalers and resell it to offices, bodegas, and small businesses at
                tier-2 pricing — with same-day delivery, no minimums, and zero inventory risk.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="xl" variant="orange" asChild>
                  <a href="#apply">
                    Apply for Wholesale <ArrowRight className="h-5 w-5" />
                  </a>
                </Button>
                <Button
                  size="xl"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10"
                  asChild
                >
                  <Link href="/b2b/catalog">View Live Catalog</Link>
                </Button>
              </div>
            </div>

            {/* Quick stats */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              {[
                { value: '0', label: 'Minimum Order', emoji: '💰' },
                { value: 'Same-Day', label: 'Delivery Window', emoji: '⚡' },
                { value: 'Tier-2', label: 'B2B Pricing', emoji: '🏷️' },
                { value: '24hr', label: 'Account Setup', emoji: '🚀' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white/10 border border-white/15 rounded-2xl p-5 text-center"
                >
                  <div className="text-2xl mb-1">{stat.emoji}</div>
                  <div className="text-xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-blue-300 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 w-full space-y-20">
        {/* ── Pillars ── */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-charcoal">How the Model Works</h2>
            <p className="text-gray-500 mt-2 max-w-2xl mx-auto">
              We&apos;re a digital storefront sitting on top of legacy wholesalers — your last-mile, your online catalog,
              your account manager, rolled into one.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PILLARS.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 p-6"
              >
                <div className={`w-12 h-12 rounded-xl ${p.color} flex items-center justify-center mb-4`}>
                  <p.icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-brand-charcoal mb-2">{p.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Who It's For ── */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-charcoal">Who We Serve</h2>
            <p className="text-gray-500 mt-2">Two audiences. One platform. Both buy at wholesale.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Offices */}
            <div className="rounded-3xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-brand-green text-white flex items-center justify-center">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-brand-charcoal">For Offices</h3>
                  <p className="text-sm text-gray-500">Refill programs for teams, clients, and waiting rooms</p>
                </div>
              </div>
              <ul className="space-y-2.5 mb-6">
                {OFFICE_PERKS.map((perk) => (
                  <li key={perk} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-brand-green" />
                    {perk}
                  </li>
                ))}
              </ul>
              <Link
                href="/office-refill"
                className="inline-flex items-center gap-2 bg-brand-green text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-brand-green/90 transition-colors"
              >
                Office Refill Program <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Retailers */}
            <div className="rounded-3xl bg-gradient-to-br from-orange-50 to-white border border-orange-100 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-brand-orange text-white flex items-center justify-center">
                  <Store className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-brand-charcoal">For Small Retailers</h3>
                  <p className="text-sm text-gray-500">Bodegas, convenience stores, cafés, food trucks</p>
                </div>
              </div>
              <ul className="space-y-2.5 mb-6">
                {RETAILER_PERKS.map((perk) => (
                  <li key={perk} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-brand-orange" />
                    {perk}
                  </li>
                ))}
              </ul>
              <a
                href="#apply"
                className="inline-flex items-center gap-2 bg-brand-orange text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-brand-orange/90 transition-colors"
              >
                Apply for an Account <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-charcoal">From Application to Delivery</h2>
            <p className="text-gray-500 mt-2">Three steps. No paperwork. No pallet minimums.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {HOW_IT_WORKS.map((s, i) => {
              const Icon = [ShieldCheck, Boxes, Truck][i]
              const color = ['bg-blue-50 text-blue-600', 'bg-emerald-50 text-brand-green', 'bg-orange-50 text-brand-orange'][i]
              return (
                <div key={s.step} className="flex flex-col items-center text-center">
                  <div className="relative mb-5">
                    <div className={`w-20 h-20 rounded-2xl ${color} flex items-center justify-center shadow-sm`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-brand-orange text-white text-xs font-bold flex items-center justify-center shadow-md">
                      {s.step}
                    </div>
                  </div>
                  <h3 className="font-bold text-brand-charcoal text-lg mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Subscription Bundles ── */}
        <section id="subscriptions">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-charcoal">Subscription Bundles</h2>
            <p className="text-gray-500 mt-2 max-w-2xl mx-auto">
              Set it up once. We deliver a curated bundle on your cadence — markup baked in, billing handled, restocks
              automatic.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {SUBSCRIPTION_BUNDLES.map((plan) => {
              const isLoadingThis = subscribingPlan === plan.slug
              return (
                <div
                  key={plan.slug}
                  className={`rounded-2xl flex flex-col transition-transform ${
                    plan.highlight
                      ? 'bg-brand-green text-white shadow-2xl scale-[1.03] ring-2 ring-brand-green/20'
                      : 'bg-white border border-gray-100 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="p-7 flex-1">
                    {plan.highlight && (
                      <span className="text-xs font-bold bg-brand-orange text-white rounded-full px-3 py-1 inline-block mb-4">
                        MOST POPULAR
                      </span>
                    )}
                    <h3 className={`text-xl font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-brand-charcoal'}`}>
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className={`text-4xl font-bold ${plan.highlight ? 'text-white' : 'text-brand-charcoal'}`}>
                        {plan.price}
                      </span>
                      <span className={`text-sm ${plan.highlight ? 'text-green-200' : 'text-gray-400'}`}>
                        {plan.period}
                      </span>
                    </div>
                    <p className={`text-sm mb-5 ${plan.highlight ? 'text-green-100' : 'text-gray-500'}`}>
                      {plan.tagline}
                    </p>
                    <div className={`rounded-xl p-3 mb-5 ${plan.highlight ? 'bg-white/10' : 'bg-brand-cream'}`}>
                      <p className={`text-xs flex items-center gap-1.5 ${plan.highlight ? 'text-green-100' : 'text-gray-600'}`}>
                        <Boxes className="h-3.5 w-3.5" /> {plan.items}
                      </p>
                      <p className={`text-xs mt-1 flex items-center gap-1.5 ${plan.highlight ? 'text-green-100' : 'text-gray-600'}`}>
                        <Clock className="h-3.5 w-3.5" /> {plan.cadence}
                      </p>
                    </div>
                    <ul className="space-y-2.5">
                      {plan.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-2 text-sm">
                          <CheckCircle
                            className={`h-4 w-4 shrink-0 mt-0.5 ${plan.highlight ? 'text-green-300' : 'text-brand-green'}`}
                          />
                          <span className={plan.highlight ? 'text-green-100' : 'text-gray-600'}>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="px-7 pb-7">
                    <button
                      onClick={() => handleSubscribe(plan.slug)}
                      disabled={!!subscribingPlan}
                      className={`w-full inline-flex items-center justify-center gap-2 rounded-xl font-semibold py-3 text-sm transition-colors disabled:opacity-70 ${
                        plan.highlight
                          ? 'bg-white text-brand-green hover:bg-green-50'
                          : 'bg-brand-green text-white hover:bg-brand-green/90'
                      }`}
                    >
                      {isLoadingThis ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Zap className="h-4 w-4" /> Subscribe Now
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          {subscribeError && (
            <p className="text-center text-sm text-red-600 mt-4">{subscribeError}</p>
          )}
          <p className="text-center text-xs text-gray-400 mt-6">
            Subscriptions are billed by Stripe. Cancel or pause anytime from your B2B dashboard.
          </p>
        </section>

        {/* ── Apply ── */}
        <section id="apply">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-brand-charcoal mb-2">Apply for a Wholesale Account</h2>
              <p className="text-gray-500">
                Tell us about your business. We&apos;ll reach out within 24 hours with pricing access and a starter quote.
              </p>
            </div>

            {submitted ? (
              <div className="rounded-2xl bg-green-50 border border-green-100 p-12 text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-xl font-bold text-green-800 mb-2">Application received</h3>
                <p className="text-green-700">
                  Our team will reach out within 24 hours to set up your wholesale account.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl bg-white border border-gray-100 shadow-sm p-8 space-y-5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Business Name *</Label>
                    <Input
                      required
                      value={form.business_name}
                      onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))}
                      placeholder="Sami's Bodega"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Name</Label>
                    <Input
                      value={form.contact_name}
                      onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))}
                      placeholder="Sami Khoury"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="sami@bodega.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="(973) 555-0100"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Business Type</Label>
                    <Select
                      value={form.business_type}
                      onValueChange={(v) => setForm((f) => ({ ...f, business_type: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUSINESS_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Estimated Monthly Spend</Label>
                    <Select
                      value={form.estimated_budget}
                      onValueChange={(v) => setForm((f) => ({ ...f, estimated_budget: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select budget" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under_500">Under $500/mo</SelectItem>
                        <SelectItem value="500_1500">$500 – $1,500/mo</SelectItem>
                        <SelectItem value="1500_5000">$1,500 – $5,000/mo</SelectItem>
                        <SelectItem value="5000_plus">$5,000+/mo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>What products are you interested in?</Label>
                  <Textarea
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="Drinks, snacks, Middle Eastern specialty goods, household, etc. Mention brands or SKUs if you have them."
                  />
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Submit Application <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="rounded-3xl bg-gradient-to-r from-brand-navy to-slate-800 text-white p-8 sm:p-12 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold mb-3">
            Already have an account?
          </h3>
          <p className="text-blue-100 max-w-lg mx-auto mb-6">
            Sign in to see live wholesale pricing and place an order from the catalog.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="xl" variant="orange" asChild>
              <Link href="/b2b/catalog">
                Open Wholesale Catalog <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="xl"
              variant="outline"
              className="border-white/40 text-white hover:bg-white/10"
              asChild
            >
              <Link href="/b2b/dashboard">Go to B2B Dashboard</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
