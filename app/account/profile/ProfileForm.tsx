'use client'

import { useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

export function ProfileForm({ profile }: { profile: Profile }) {
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [phone, setPhone]       = useState(profile?.phone ?? '')
  const [loading, setLoading]   = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSaved(false)
    const supabase = createClient()
    const { error: err } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone })
      .eq('id', profile.id)
    setLoading(false)
    if (err) setError(err.message)
    else setSaved(true)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <div className="space-y-2">
        <Label>Full Name</Label>
        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Smith" />
      </div>
      <div className="space-y-2">
        <Label>Phone</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(973) 555-0100" type="tel" />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input value={profile.email ?? ''} disabled className="bg-gray-50 text-gray-400" />
        <p className="text-xs text-gray-400">Email cannot be changed here.</p>
      </div>

      {error  && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      {saved  && <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">Profile saved!</p>}

      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save Changes</>}
      </Button>
    </form>
  )
}
