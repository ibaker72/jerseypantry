'use client'

import { useState } from 'react'
import { Mail, MapPin, Clock, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function ContactPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // TODO: Integrate Resend for actual email sending when RESEND_API_KEY is set
    await new Promise((r) => setTimeout(r, 800))
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-brand-charcoal mb-3">Get in Touch</h1>
          <p className="text-gray-500">Have a question, feedback, or want to learn about our Office Refill program? We&apos;re here to help.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { icon: <Mail className="h-5 w-5 text-brand-green" />, label: 'Email', value: 'hello@mycornerstore.com' },
            { icon: <MapPin className="h-5 w-5 text-brand-green" />, label: 'Area', value: 'North Jersey, NJ' },
            { icon: <Clock className="h-5 w-5 text-brand-green" />, label: 'Delivery Hours', value: '11AM – 7PM Daily' },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl bg-white border border-gray-100 p-4 text-center">
              <div className="flex justify-center mb-2">{item.icon}</div>
              <p className="text-xs text-gray-400">{item.label}</p>
              <p className="text-sm font-medium text-brand-charcoal">{item.value}</p>
            </div>
          ))}
        </div>

        {sent ? (
          <div className="rounded-2xl bg-green-50 border border-green-100 p-10 text-center">
            <div className="text-5xl mb-4">✉️</div>
            <h3 className="text-xl font-bold text-green-800 mb-2">Message sent!</h3>
            <p className="text-green-700">We&apos;ll get back to you within 24 hours.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-8 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="john@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                required
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="Order question, refill inquiry, feedback…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="Tell us how we can help…"
              />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Send Message</>}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
