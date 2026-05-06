'use client'

import { useState } from 'react'
import { Gift, Copy, Check, Users, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Profile, Referral } from '@/types'

interface Props {
  profile: Profile
  referrals: Referral[]
}

const REFERRER_CREDIT = 10
const REFERRED_CREDIT = 5

export function ReferralClient({ profile, referrals }: Props) {
  const [copied, setCopied] = useState(false)

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const referralUrl = `${siteUrl}/?ref=${profile.referral_code}`

  async function copy() {
    await navigator.clipboard.writeText(referralUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const credited  = referrals.filter((r) => r.status === 'credited')
  const pending   = referrals.filter((r) => r.status === 'pending')
  const totalEarned = credited.length * REFERRER_CREDIT

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-charcoal flex items-center gap-2">
        <Gift className="h-6 w-6 text-brand-green" /> Refer a Friend
      </h1>

      {/* How it works */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-green to-green-700 text-white p-6">
        <p className="font-semibold text-lg mb-4">Give ${REFERRED_CREDIT}, Get ${REFERRER_CREDIT}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="bg-white/10 rounded-xl p-4">
            <p className="font-bold text-green-200 mb-1">1. Share</p>
            <p className="text-green-100">Send your unique link to friends and family</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="font-bold text-green-200 mb-1">2. They Order</p>
            <p className="text-green-100">They sign up and complete their first order</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="font-bold text-green-200 mb-1">3. Both Win</p>
            <p className="text-green-100">You get ${REFERRER_CREDIT} · they get ${REFERRED_CREDIT} in store credit</p>
          </div>
        </div>
      </div>

      {/* Store credit balance */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-brand-green/10 rounded-xl p-3">
            <DollarSign className="h-5 w-5 text-brand-green" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Available Store Credit</p>
            <p className="text-2xl font-bold text-brand-green">${(profile.store_credit ?? 0).toFixed(2)}</p>
          </div>
        </div>
        <p className="text-sm text-gray-400 text-right">Applied automatically<br/>at checkout</p>
      </div>

      {/* Referral link */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 space-y-3">
        <h2 className="font-semibold text-brand-charcoal">Your Referral Link</h2>
        <div className="flex gap-2">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-gray-700 truncate">
            {referralUrl}
          </div>
          <Button onClick={copy} variant="outline" className="gap-2 shrink-0">
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
        <p className="text-xs text-gray-400">Code: <span className="font-mono font-bold">{profile.referral_code}</span></p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Referrals Sent', value: referrals.length, icon: Users },
          { label: 'Completed', value: credited.length, icon: Check },
          { label: 'Total Earned', value: `$${totalEarned}`, icon: DollarSign },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 text-center">
            <Icon className="h-5 w-5 text-brand-green mx-auto mb-1" />
            <p className="text-xl font-bold text-brand-charcoal">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Referral history */}
      {referrals.length > 0 && (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-brand-charcoal">Referral History</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {referrals.map((r) => (
              <div key={r.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-brand-charcoal">{r.referred_email ?? 'Friend'}</p>
                  <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    r.status === 'credited' ? 'bg-green-100 text-green-700' :
                    r.status === 'pending'  ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>{r.status}</span>
                  {r.status === 'credited' && (
                    <p className="text-xs text-brand-green font-semibold mt-0.5">+${r.referrer_credit}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <p className="text-sm text-gray-500 text-center">
          {pending.length} referral{pending.length !== 1 ? 's' : ''} pending — credit posts when they complete their first order.
        </p>
      )}
    </div>
  )
}
