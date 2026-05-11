'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingDown,
  Upload,
  MapPin,
  Building2,
  LogOut,
  Zap,
  Tag,
  RefreshCw,
  Briefcase,
  Truck,
  Calculator,
  Boxes,
  MessageSquarePlus,
  Factory,
  PackagePlus,
  ScanLine,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/receiving', label: 'Receiving', icon: ScanLine },
  { href: '/admin/inventory', label: 'Low Stock', icon: TrendingDown },
  { href: '/admin/inventory/lots', label: 'Inventory Lots', icon: PackagePlus },
  { href: '/admin/suppliers', label: 'Suppliers', icon: Factory },
  { href: '/admin/stock-requests', label: 'Stock Requests', icon: MessageSquarePlus },
  { href: '/admin/flash-sales', label: 'Flash Sales', icon: Zap },
  { href: '/admin/promotions', label: 'Promotions', icon: Tag },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: RefreshCw },
  { href: '/admin/import', label: 'CSV Import', icon: Upload },
  { href: '/admin/delivery-zones', label: 'Delivery Zones', icon: MapPin },
  { href: '/admin/office-refill-leads', label: 'Office Leads', icon: Building2 },
  { href: '/admin/b2b/accounts', label: 'B2B Accounts', icon: Briefcase },
  { href: '/admin/b2b/plans', label: 'B2B Plan Baskets', icon: Boxes },
  { href: '/admin/dispatch', label: 'Dispatcher', icon: Truck },
  { href: '/admin/margin-calculator', label: 'Margin Calc', icon: Calculator },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-64 shrink-0 bg-brand-green text-white flex flex-col min-h-screen">
      <div className="p-6 border-b border-green-700">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🏪</span>
          <div>
            <p className="font-bold text-sm leading-none">My Corner Store</p>
            <p className="text-green-300 text-xs mt-0.5">Admin Dashboard</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-white/15 text-white'
                  : 'text-green-200 hover:bg-white/10 hover:text-white'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-green-700">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-green-200 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
