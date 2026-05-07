// ── Wholesale Inventory ──────────────────────────────────────────────────────

export type AvailabilityStatus =
  | 'same_day_pickup'
  | 'wholesale_verified'
  | 'limited'
  | 'unavailable'

export interface WholesaleInventoryRecord {
  id: string
  product_id: string
  wholesaler_name: string
  wholesaler_stock: number
  buffer_pct: number
  wholesale_unit: string
  unit_count: number
  weight_lbs: number
  volume_cubic_ft: number
  last_verified_at: string
  created_at: string
  updated_at: string
}

export interface WholesaleProduct {
  id: string
  name: string
  slug: string
  image_url: string | null
  category: string
  sku: string | null
  // Wholesale packaging
  wholesale_unit: string
  unit_count: number
  // Pricing
  wholesale_price: number
  market_price: number
  custom_price: number | null
  // Physical dimensions per case
  weight_lbs: number
  volume_cubic_ft: number
  // Availability
  availability_status: AvailabilityStatus
  available_quantity: number
}

// ── Order Summary ────────────────────────────────────────────────────────────

export interface WholesaleOrderItem {
  product_id: string
  product_name: string
  wholesale_unit: string
  quantity: number
  unit_price: number
  line_total: number
  weight_lbs: number
  volume_cubic_ft: number
}

export interface WholesaleOrderSummary {
  items: WholesaleOrderItem[]
  subtotal: number
  total_weight_lbs: number
  total_volume_cubic_ft: number
  item_count: number
}

// ── Dispatch / Delivery ──────────────────────────────────────────────────────

export type DeliveryType = 'self_delivery' | 'courier'

export type CourierProvider = 'doordash' | 'uber'

export type DispatchStatus =
  | 'pending_pickup'
  | 'picked_up_from_wholesaler'
  | 'out_for_delivery'
  | 'delivered'
  | 'driver_assigned'
  | 'at_wholesaler'
  | 'courier_dispatched'

export interface DispatchOrder {
  id: string
  order_id: string
  order_number?: string
  customer_email?: string
  total_weight_lbs: number
  distance_miles: number | null
  delivery_type: DeliveryType
  courier_provider: CourierProvider | null
  courier_quote_id: string | null
  courier_fee: number | null
  courier_tracking_url: string | null
  driver_name: string | null
  status: DispatchStatus
  pickup_confirmed_at: string | null
  out_for_delivery_at: string | null
  delivered_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // joined
  orders?: {
    order_number: string
    email: string
    delivery_address: Record<string, string> | null
    total: number
  }
}

export interface CourierQuoteRequest {
  order_id: string
  pickup_address: string
  dropoff_address: string
  total_weight_lbs: number
}

export interface CourierQuoteResponse {
  quote_id: string
  provider: CourierProvider
  fee: number
  eta_minutes: number
  expires_at: string
}

export interface DispatchDecision {
  delivery_type: DeliveryType
  reason: string
  courier_eligible: boolean
  weight_lbs: number
  distance_miles: number | null
}

// ── Reserve Wholesale Stock (RPC result) ─────────────────────────────────────

export interface ReserveStockResult {
  success: boolean
  reserved?: number
  remaining?: number
  error?: string
  available?: number
}
