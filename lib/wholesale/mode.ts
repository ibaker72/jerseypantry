'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const COOKIE_NAME = 'wholesale_mode'

/**
 * Returns true if the current user has the wholesale mode cookie set AND
 * is still wholesale-approved on the server. Both gates required — cookie
 * alone is never trusted.
 */
export async function getWholesaleMode(): Promise<boolean> {
  const jar = await cookies()
  if (jar.get(COOKIE_NAME)?.value !== '1') return false

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data, error } = await supabase.rpc('is_wholesale_approved', { uid: user.id })
  if (error) return false
  return Boolean(data)
}

/**
 * Returns whether the current user is wholesale-approved (regardless of
 * cookie). Used to decide whether to render the header toggle at all.
 */
export async function isCurrentUserWholesaleApproved(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data, error } = await supabase.rpc('is_wholesale_approved', { uid: user.id })
  if (error) return false
  return Boolean(data)
}

/**
 * Server action — flip the wholesale mode cookie. Refuses if the caller is
 * not wholesale-approved on the server. After the flip, revalidates the
 * full layout so retail pages re-render with the new prices.
 */
export async function setWholesaleMode(
  on: boolean
): Promise<{ success: boolean; error?: string }> {
  if (on) {
    const approved = await isCurrentUserWholesaleApproved()
    if (!approved) {
      return { success: false, error: 'Not approved for wholesale access.' }
    }
  }

  const jar = await cookies()
  if (on) {
    jar.set(COOKIE_NAME, '1', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
  } else {
    jar.delete(COOKIE_NAME)
  }

  revalidatePath('/', 'layout')
  return { success: true }
}
