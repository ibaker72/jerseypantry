import { Suspense } from 'react'
import { AcceptInviteClient } from './AcceptInviteClient'

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Suspense fallback={<div className="text-gray-400 text-sm">Loading…</div>}>
        <AcceptInviteClient />
      </Suspense>
    </div>
  )
}
