import Link from 'next/link'
import { Package, ShoppingCart, TrendingDown, Building2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminStatCard } from '@/components/admin/AdminStatCard'
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils/format'
import type { Order, OrderStatus } from '@/types'

export const metadata = { title: 'Admin Dashboard' }

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { count: productCount },
    { count: orderCount },
    { data: recentOrders },
    { data: lowStock },
    { count: leadCount },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('products').select('id, name, inventory_quantity, reorder_threshold').eq('is_active', true).lt('inventory_quantity', 10).order('inventory_quantity'),
    supabase.from('office_refill_leads').select('*', { count: 'exact', head: true }).eq('status', 'new'),
  ])

  const revenue = (recentOrders as Order[] ?? [])
    .filter((o) => ['paid', 'preparing', 'out_for_delivery', 'completed'].includes(o.status))
    .reduce((sum, o) => sum + o.total, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-charcoal">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">My Corner Store Admin</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new"><Plus className="h-4 w-4" /> Add Product</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <AdminStatCard title="Active Products" value={productCount ?? 0} icon={<Package className="h-5 w-5" />} color="green" />
        <AdminStatCard title="Total Orders" value={orderCount ?? 0} icon={<ShoppingCart className="h-5 w-5" />} color="blue" />
        <AdminStatCard title="Low Stock Items" value={(lowStock ?? []).length} subtitle="Below threshold" icon={<TrendingDown className="h-5 w-5" />} color="red" />
        <AdminStatCard title="New Leads" value={leadCount ?? 0} subtitle="Office Refill" icon={<Building2 className="h-5 w-5" />} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-brand-charcoal">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm text-brand-green hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {(recentOrders as Order[] ?? []).length === 0 && (
              <p className="text-sm text-gray-400 py-4 text-center">No orders yet.</p>
            )}
            {(recentOrders as Order[] ?? []).map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center justify-between rounded-xl hover:bg-gray-50 p-2 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-brand-charcoal">{order.order_number}</p>
                  <p className="text-xs text-gray-400">{order.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">{formatPrice(order.total)}</span>
                  <OrderStatusBadge status={order.status as OrderStatus} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Low stock */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-brand-charcoal">Low Stock Alert</h2>
            <Link href="/admin/inventory" className="text-sm text-brand-green hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {(lowStock ?? []).length === 0 && (
              <p className="text-sm text-gray-400 py-4 text-center">All products well stocked! 🎉</p>
            )}
            {(lowStock ?? []).slice(0, 6).map((p) => (
              <Link
                key={p.id}
                href={`/admin/products/${p.id}`}
                className="flex items-center justify-between rounded-xl hover:bg-gray-50 p-2 transition-colors"
              >
                <p className="text-sm text-brand-charcoal truncate flex-1">{p.name}</p>
                <div className="ml-3 shrink-0">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.inventory_quantity === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                    {p.inventory_quantity} left
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
