'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Calendar,
  Users,
  CreditCard,
  Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const navItems = [
  { href: '/b2b/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/b2b/catalog', label: 'My Catalog', icon: Package },
  { href: '/b2b/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/b2b/schedule', label: 'Delivery Schedule', icon: Calendar },
  { href: '/b2b/members', label: 'Team', icon: Users },
  { href: '/b2b/billing', label: 'Billing', icon: CreditCard },
]

interface Props {
  businessName: string
  memberRole: string
}

export function B2BSidebar({ businessName, memberRole }: Props) {
  const pathname = usePathname()

  return (
    <aside className="w-full md:w-56 shrink-0">
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-brand-green text-white p-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 opacity-80" />
            <div>
              <p className="font-semibold text-sm leading-tight line-clamp-1">{businessName}</p>
              <p className="text-green-200 text-xs capitalize">{memberRole}</p>
            </div>
          </div>
        </div>
        <nav className="py-2">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                  active
                    ? 'bg-green-50 text-brand-green font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
