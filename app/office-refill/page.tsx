'use client'

import { useState } from 'react'
import {
  Building2,
  CheckCircle,
  Loader2,
  ArrowRight,
  Zap,
  Car,
  Scissors,
  Dumbbell,
  Stethoscope,
  Briefcase,
  Home,
  Package,
  CalendarCheck,
  Truck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const plans = [
  {
    name: 'Starter Refill',
    price: '$99',
    period: '/mo',
    desc: 'Perfect for small offices, waiting rooms, and barbershops.',
    features: [
      'Up to 50 items/month',
      'Drinks & snacks mix',
      'Bi-weekly delivery',
      'Dedicated account rep',
    ],
    highlight: false,
  },
  {
    name: 'Standard Refill',
    price: '$199',
    period: '/mo',
    desc: 'Best for gyms, dealerships, and mid-size offices.',
    features: [
      'Up to 120 items/month',
      'Custom product selection',
      'Weekly delivery',
      'Priority support',
      'Invoicing available',
    ],
    highlight: true,
  },
  {
    name: 'Premium Refill',
    price: '$399',
    period: '/mo',
    desc: 'Full-service for large offices, corporate suites, and multi-location.',
    features: [
      'Unlimited items',
      'Fully customized mix',
      '2× weekly delivery',
      'Dedicated delivery driver',
      'Net-30 billing',
      'Custom branding inserts',
    ],
    highlight: false,
  },
]

const businessTypes = [
  'Auto Dealership',
  'Barbershop / Salon',
  'Gym / Fitness Center',
  'Corporate Office',
  'Medical / Dental Office',
  'Real Estate Office',
  'Mechanic Shop',
  'Retail Store',
  'Restaurant / Café',
  'Other',
]

const INDUSTRY_CARDS = [
  {
    icon: Car,
    emoji: '🚗',
    title: 'Auto Dealerships',
    desc: 'Keep your showroom and waiting area stocked. Impress clients while they wait for service.',
  },
  {
    icon: Scissors,
    emoji: '✂️',
    title: 'Barbershops & Salons',
    desc: 'Refreshments for clients during appointments. A small touch that builds loyalty.',
  },
  {
    icon: Dumbbell,
    emoji: '💪',
    title: 'Gyms & Fitness Centers',
    desc: 'Energy drinks, protein bars, and hydration essentials for your members and staff.',
  },
  {
    icon: Stethoscope,
    emoji: '🏥',
    title: 'Medical & Dental Offices',
    desc: 'Comfortable waiting rooms with water, snacks, and beverages for patients and staff.',
  },
  {
    icon: Briefcase,
    emoji: '🏢',
    title: 'Corporate Offices',
    desc: 'Weekly snack drops for your team. Boost morale without the hassle of supply runs.',
  },
  {
    icon: Home,
    emoji: '🏡',
    title: 'Real Estate Offices',
    desc: 'Client-ready refreshments for open houses, closings, and busy agent days.',
  },
]

const PLAN_SLUGS = ['starter', 'standard', 'premium'] as const
type PlanSlug = (typeof PLAN_SLUGS)[number]

export default function OfficeRefillPage() {
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
        body: JSON.stringify({ plan: planSlug, billing_type: 'card' }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else if (res.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent('/office-refill')}`
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
        body: JSON.stringify(form),
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
                <Building2 className="h-4 w-4 text-brand-orange" />
                Office Refill Program
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold mb-5 leading-tight">
                Keep Your Business{' '}
                <span className="text-brand-orange">Stocked.</span>
              </h1>
              <p className="text-blue-100 max-w-lg leading-relaxed text-lg mb-8">
                Never run out of snacks and drinks for your team, clients, or customers. We deliver on a
                recurring schedule so you never have to think about restocking again.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="xl" variant="orange" asChild>
                  <a href="#plans">
                    View Plans <ArrowRight className="h-5 w-5" />
                  </a>
                </Button>
                <Button
                  size="xl"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10"
                  asChild
                >
                  <a href="#contact-form">Request Custom Quote</a>
                </Button>
              </div>
            </div>

            {/* Stats block */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              {[
                { value: '50+', label: 'Businesses Served', emoji: '🏢' },
                { value: '99%', label: 'On-time Delivery', emoji: '⚡' },
                { value: '$99', label: 'Starting Monthly', emoji: '💰' },
                { value: '24hr', label: 'Setup Time', emoji: '🚀' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white/10 border border-white/15 rounded-2xl p-5 text-center"
                >
                  <div className="text-2xl mb-1">{stat.emoji}</div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-blue-300 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 w-full space-y-20">

        {/* ── How It Works ── */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-charcoal">How It Works</h2>
            <p className="text-gray-500 mt-2">Up and running in 24 hours. No hassle.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: Package,
                step: '1',
                title: 'Pick a Plan',
                desc: 'Choose from Starter, Standard, or Premium — or request a fully custom quote for your business.',
                color: 'bg-blue-50 text-blue-600',
              },
              {
                icon: CalendarCheck,
                step: '2',
                title: 'Choose Your Products',
                desc: 'Tell us your team size, preferred snacks, drinks, and dietary needs. We handle the curation.',
                color: 'bg-emerald-50 text-brand-green',
              },
              {
                icon: Truck,
                step: '3',
                title: 'Get Recurring Delivery',
                desc: 'We deliver weekly or bi-weekly on a schedule that works for your business. Adjust anytime.',
                color: 'bg-orange-50 text-brand-orange',
              },
            ].map((step) => (
              <div key={step.step} className="flex flex-col items-center text-center">
                <div className="relative mb-5">
                  <div className={`w-20 h-20 rounded-2xl ${step.color} flex items-center justify-center shadow-sm`}>
                    <step.icon className="h-8 w-8" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-brand-orange text-white text-xs font-bold flex items-center justify-center shadow-md">
                    {step.step}
                  </div>
                </div>
                <h3 className="font-bold text-brand-charcoal text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Plans ── */}
        <section id="plans">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-charcoal">Refill Plans</h2>
            <p className="text-gray-500 mt-2">Transparent pricing. No hidden fees. Cancel anytime.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {plans.map((plan, i) => {
              const slug = PLAN_SLUGS[i]
              const isLoadingThis = subscribingPlan === slug
              return (
                <div
                  key={plan.name}
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
                    <p className={`text-sm mb-6 ${plan.highlight ? 'text-green-100' : 'text-gray-500'}`}>
                      {plan.desc}
                    </p>
                    <ul className="space-y-3">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm">
                          <CheckCircle
                            className={`h-4 w-4 shrink-0 mt-0.5 ${plan.highlight ? 'text-green-300' : 'text-brand-green'}`}
                          />
                          <span className={plan.highlight ? 'text-green-100' : 'text-gray-600'}>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="px-7 pb-7 space-y-2">
                    <button
                      onClick={() => handleSubscribe(slug)}
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
                    <a
                      href="#contact-form"
                      className={`block text-center text-xs underline ${
                        plan.highlight ? 'text-green-200' : 'text-gray-400'
                      } hover:opacity-80`}
                    >
                      Or request a custom quote
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
          {subscribeError && (
            <p className="text-center text-sm text-red-600 mt-4">{subscribeError}</p>
          )}
        </section>

        {/* ── Industries We Serve ── */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-charcoal">Who We Serve</h2>
            <p className="text-gray-500 mt-2">
              Trusted by local North Jersey businesses across every industry
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {INDUSTRY_CARDS.map((industry) => (
              <div
                key={industry.title}
                className="rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 p-6 flex gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-cream flex items-center justify-center text-2xl shrink-0">
                  {industry.emoji}
                </div>
                <div>
                  <h3 className="font-bold text-brand-charcoal mb-1">{industry.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{industry.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Lead Form ── */}
        <section id="contact-form">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-brand-charcoal mb-2">Request a Custom Quote</h2>
              <p className="text-gray-500">
                Tell us about your business and we&apos;ll reach out with a personalized refill plan within 24 hours.
              </p>
            </div>

            {submitted ? (
              <div className="rounded-2xl bg-green-50 border border-green-100 p-12 text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-xl font-bold text-green-800 mb-2">We got your request!</h3>
                <p className="text-green-700">
                  Our team will reach out within 24 hours to discuss your plan.
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
                      placeholder="Joe's Auto Dealership"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Name</Label>
                    <Input
                      value={form.contact_name}
                      onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))}
                      placeholder="Joe Smith"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email Address *</Label>
                    <Input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="joe@dealership.com"
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
                        {businessTypes.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Estimated Monthly Budget</Label>
                    <Select
                      value={form.estimated_budget}
                      onValueChange={(v) => setForm((f) => ({ ...f, estimated_budget: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select budget" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under_100">Under $100/mo</SelectItem>
                        <SelectItem value="100_200">$100 – $200/mo</SelectItem>
                        <SelectItem value="200_400">$200 – $400/mo</SelectItem>
                        <SelectItem value="400_plus">$400+/mo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tell us more</Label>
                  <Textarea
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="Team size, preferred snacks, delivery preferences, special requests…"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Submit Request <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="rounded-3xl bg-gradient-to-r from-brand-orange to-amber-500 text-white p-8 sm:p-12 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold mb-3">
            Ready to keep your business stocked?
          </h3>
          <p className="text-orange-100 max-w-lg mx-auto mb-6">
            Join local North Jersey businesses that rely on My Corner Store for hassle-free, recurring snack and drink delivery.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="xl"
              className="bg-white text-brand-orange hover:bg-orange-50 font-bold"
              asChild
            >
              <a href="#plans">
                Choose a Plan <ArrowRight className="h-5 w-5" />
              </a>
            </Button>
            <Button
              size="xl"
              variant="outline"
              className="border-white/40 text-white hover:bg-white/10"
              asChild
            >
              <a href="#contact-form">Request Custom Refill Plan</a>
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
