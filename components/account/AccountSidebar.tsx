'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { User, Package, MapPin, LogOut, Star, Users, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'

const NAV = [
  { href: '/account',                  label: 'Dashboard',     icon: Star },
  { href: '/account/orders',           label: 'Order History', icon: Package },
  { href: '/account/subscriptions',    label: 'Subscriptions', icon: RefreshCw },
  { href: '/account/referrals',        label: 'Referrals',     icon: Users },
  { href: '/account/addresses',        label: 'Addresses',     icon: MapPin },
  { href: '/account/profile',          label: 'Profile',       icon: User },
]

export function AccountSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <aside className="w-full md:w-56 shrink-0">
      <nav className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-b border-gray-50 last:border-0',
                active
                  ? 'bg-brand-green text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 w-full transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign Out
        </button>
      </nav>
    </aside>
  )
}
