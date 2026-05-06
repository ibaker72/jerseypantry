'use client'

import { useState } from 'react'
import { Users, UserPlus, Trash2, CheckCircle, Clock, Mail } from 'lucide-react'
import type { BusinessMember, B2BMemberRole } from '@/types'

interface Props {
  businessId: string
  currentUserRole: string
  members: BusinessMember[]
}

export function B2BMembersClient({ businessId, currentUserRole, members: initialMembers }: Props) {
  const [members, setMembers] = useState(initialMembers)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<B2BMemberRole>('member')
  const [spendLimit, setSpendLimit] = useState('')
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const isOwner = currentUserRole === 'owner'

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/b2b/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          email: inviteEmail,
          role: inviteRole,
          spend_limit: spendLimit ? parseFloat(spendLimit) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMembers((prev) => [...prev, data.member])
      setInviteEmail('')
      setSpendLimit('')
      setSuccess(`Invite sent to ${inviteEmail}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setInviting(false)
    }
  }

  const handleRemove = async (memberId: string, email: string) => {
    if (!confirm(`Remove ${email} from your team?`)) return
    const res = await fetch(`/api/b2b/members/${memberId}`, { method: 'DELETE' })
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.id !== memberId))
    } else {
      const data = await res.json()
      alert(data.error)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-charcoal">Team Members</h1>

      {/* Member list */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="font-semibold text-brand-charcoal">{members.length} member{members.length !== 1 ? 's' : ''}</span>
        </div>
        {members.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No team members yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-brand-green uppercase">
                    {m.email[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-charcoal truncate">{m.email}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500 capitalize">{m.role}</span>
                    {m.spend_limit && (
                      <span className="text-xs text-gray-400">· ${m.spend_limit}/order limit</span>
                    )}
                    {m.accepted_at ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-yellow-600">
                        <Clock className="w-3 h-3" /> Invite pending
                      </span>
                    )}
                  </div>
                </div>
                {isOwner && m.role !== 'owner' && (
                  <button
                    onClick={() => handleRemove(m.id, m.email)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Remove member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Invite form (owners only) */}
      {isOwner && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-brand-charcoal mb-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Invite a team member
          </h2>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as B2BMemberRole)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                >
                  <option value="member">Member — can place orders</option>
                  <option value="approver">Approver — can approve orders</option>
                </select>
              </div>
            </div>
            <div className="sm:w-48">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Spend limit per order <span className="text-gray-400">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={spendLimit}
                  onChange={(e) => setSpendLimit(e.target.value)}
                  placeholder="500"
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}

            <button
              type="submit"
              disabled={inviting}
              className="bg-brand-green text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {inviting ? 'Sending invite…' : 'Send invite'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
