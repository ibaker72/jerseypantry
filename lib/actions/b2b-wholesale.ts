'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function setWholesaleApproved(
  businessId: string,
  approved: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') return { success: false, error: 'Admin only' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('business_accounts')
    .update({ is_wholesale_approved: approved })
    .eq('id', businessId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/b2b/accounts')
  return { success: true }
}
