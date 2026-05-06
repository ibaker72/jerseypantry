'use client'

import { useState } from 'react'
import { Building2, CheckCircle, Loader2, ArrowRight, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const plans = [
  {
    name: 'Starter Refill',
    price: '$99/mo',
    desc: 'Perfect for small offices, waiting rooms, and barbershops.',
    features: ['Up to 50 items/month', 'Drinks & snacks mix', 'Bi-weekly delivery', 'Dedicated account rep'],
    highlight: false,
  },
  {
    name: 'Standard Refill',
    price: '$199/mo',
    desc: 'Best for gyms, dealerships, and mid-size offices.',
    features: ['Up to 120 items/month', 'Custom product selection', 'Weekly delivery', 'Priority support', 'Invoicing available'],
    highlight: true,
  },
  {
    name: 'Premium Refill',
    price: '$399/mo',
    desc: 'Full-service for large offices, corporate suites, and multi-location.',
    features: ['Unlimited items', 'Fully customized mix', '2x weekly delivery', 'Dedicated delivery driver', 'Net-30 billing', 'Custom branding inserts'],
    highlight: false,
  },
]

const businessTypes = [
  'Auto Dealership', 'Barbershop / Salon', 'Gym / Fitness Center',
  'Corporate Office', 'Medical / Dental Office', 'Real Estate Office',
  'Mechanic Shop', 'Retail Store', 'Restaurant / Café', 'Other',
]

const PLAN_SLUGS = ['starter', 'standard', 'premium'] as const
type PlanSlug = typeof PLAN_SLUGS[number]

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
      // silent — form still shows success to avoid confusing users
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero */}
      <div className="rounded-3xl bg-gradient-to-br from-brand-navy to-[#2c3e6b] text-white p-8 sm:p-12 mb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
          <Building2 className="h-4 w-4" />
          Office Refill Program
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Keep Your Business Stocked</h1>
        <p className="text-blue-100 max-w-xl mx-auto leading-relaxed text-lg">
          Never run out of snacks and drinks for your team, clients, or customers. We deliver on a recurring schedule so you never have to think about it.
        </p>
      </div>

      {/* Who we serve */}
      <div className="mb-12 text-center">
        <h2 className="text-xl font-bold text-brand-charcoal mb-6">We Serve</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {businessTypes.filter((b) => b !== 'Other').map((type) => (
            <span key={type} className="rounded-full border-2 border-brand-green/20 bg-white px-4 py-2 text-sm font-medium text-brand-charcoal">
              {type}
            </span>
          ))}
        </div>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-14">
        {plans.map((plan, i) => {
          const slug = PLAN_SLUGS[i]
          const isLoadingThis = subscribingPlan === slug
          return (
            <div
              key={plan.name}
              className={`rounded-2xl p-6 flex flex-col ${
                plan.highlight
                  ? 'bg-brand-green text-white shadow-xl scale-105'
                  : 'bg-white border border-gray-100 shadow-sm'
              }`}
            >
              {plan.highlight && (
                <span className="text-xs font-bold bg-brand-orange text-white rounded-full px-3 py-0.5 self-start mb-3">
                  MOST POPULAR
                </span>
              )}
              <h3 className={`text-xl font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-brand-charcoal'}`}>
                {plan.name}
              </h3>
              <p className={`text-3xl font-bold mb-2 ${plan.highlight ? 'text-white' : 'text-brand-charcoal'}`}>
                {plan.price}
              </p>
              <p className={`text-sm mb-5 ${plan.highlight ? 'text-green-100' : 'text-gray-500'}`}>
                {plan.desc}
              </p>
              <ul className="space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle className={`h-4 w-4 shrink-0 ${plan.highlight ? 'text-green-300' : 'text-brand-green'}`} />
                    <span className={plan.highlight ? 'text-green-100' : 'text-gray-600'}>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(slug)}
                disabled={!!subscribingPlan}
                className={`mt-6 inline-flex items-center justify-center gap-2 rounded-xl font-semibold py-2.5 text-sm transition-colors disabled:opacity-70 ${
                  plan.highlight
                    ? 'bg-white text-brand-green hover:bg-green-50'
                    : 'bg-brand-green text-white hover:bg-brand-green/90'
                }`}
              >
                {isLoadingThis ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <><Zap className="h-4 w-4" /> Subscribe Now</>
                )}
              </button>
              <a
                href="#contact-form"
                className={`mt-2 text-center text-xs underline ${plan.highlight ? 'text-green-200' : 'text-gray-400'} hover:opacity-80`}
              >
                Or request a custom quote
              </a>
            </div>
          )
        })}
      </div>
      {subscribeError && (
        <p className="text-center text-sm text-red-600 -mt-8 mb-4">{subscribeError}</p>
      )}

      {/* Lead form */}
      <div id="contact-form" className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-brand-charcoal text-center mb-2">Request a Custom Quote</h2>
        <p className="text-gray-500 text-center mb-8">Tell us about your business and we&apos;ll reach out with a personalized refill plan.</p>

        {submitted ? (
          <div className="rounded-2xl bg-green-50 border border-green-100 p-12 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-green-800 mb-2">We got your request!</h3>
            <p className="text-green-700">Our team will reach out within 24 hours to discuss your plan.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-8 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Business Name *</Label>
                <Input required value={form.business_name} onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))} placeholder="Joe's Auto Dealership" />
              </div>
              <div className="space-y-2">
                <Label>Contact Name</Label>
                <Input value={form.contact_name} onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))} placeholder="Joe Smith" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email Address *</Label>
                <Input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="joe@dealership.com" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="(973) 555-0100" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Business Type</Label>
                <Select value={form.business_type} onValueChange={(v) => setForm((f) => ({ ...f, business_type: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {businessTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estimated Monthly Budget</Label>
                <Select value={form.estimated_budget} onValueChange={(v) => setForm((f) => ({ ...f, estimated_budget: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select budget" /></SelectTrigger>
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
              <Textarea rows={4} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} placeholder="Team size, preferred snacks, delivery preferences, special requests…" />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Submit Request <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
