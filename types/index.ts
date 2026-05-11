// ============================================================
// Core domain types for My Corner Store
// ============================================================

export type UserRole = 'customer' | 'admin'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  phone: string | null
  role: UserRole
  loyalty_points: number
  referral_code: string | null
  store_credit: number
  referred_by: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface Product {
  id: string
  category_id: string | null
  name: string
  slug: string
  description: string | null
  sku: string | null
  barcode: string | null
  brand: string | null
  size: string | null
  unit: string | null
  image_url: string | null
  wholesale_cost: number
  retail_price: number
  compare_at_price: number | null
  inventory_quantity: number
  reorder_threshold: number
  is_active: boolean
  is_featured: boolean
  is_bundle: boolean
  shipping_eligible: boolean
  delivery_eligible: boolean
  badges: string[]
  created_at: string
  updated_at: string
  // joined
  category?: Category | null
  // wholesale (only populated when fetched via products_with_wholesale view
  // for an approved business user — null otherwise)
  wholesale_price?: number | null
  case_size?: number | null
  wholesale_unit?: string | null
}

export type VelocityVerdict = 'stock_now' | 'watch' | 'virtual'

export interface WholesaleDisplay {
  wholesale_price: number
  case_size: number
  wholesale_unit: string | null
  verdict: VelocityVerdict | null
}

export interface Customer {
  id: string
  user_id: string | null
  email: string
  phone: string | null
  first_name: string | null
  last_name: string | null
  created_at: string
}

export interface Address {
  id: string
  customer_id: string
  line1: string
  line2: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string
  delivery_instructions: string | null
  created_at: string
}

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'preparing'
  | 'out_for_delivery'
  | 'completed'
  | 'canceled'
  | 'refunded'

export type FulfillmentMethod = 'local_delivery' | 'pickup' | 'shipping'

export interface Order {
  id: string
  order_number: string
  customer_id: string | null
  user_id: string | null
  email: string
  phone: string | null
  status: OrderStatus
  fulfillment_method: FulfillmentMethod
  subtotal: number
  delivery_fee: number
  shipping_fee: number
  tax_amount: number
  discount_amount: number
  loyalty_redemption_amount: number
  total: number
  loyalty_points_earned: number
  loyalty_points_redeemed: number
  store_credit_redeemed: number
  promotion_ids: string[]
  stripe_checkout_session_id: string | null
  stripe_payment_intent_id: string | null
  delivery_address: DeliveryAddress | null
  notes: string | null
  created_at: string
  updated_at: string
  // joined
  order_items?: OrderItem[]
  customer?: Customer | null
}

export interface DeliveryAddress {
  line1: string
  line2?: string
  city: string
  state: string
  postal_code: string
  country: string
  delivery_instructions?: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  sku: string | null
  quantity: number
  unit_price: number
  line_total: number
  created_at: string
}

export interface DeliveryZone {
  id: string
  name: string
  postal_code: string
  city: string | null
  delivery_fee: number
  free_delivery_minimum: number
  is_active: boolean
  created_at: string
}

export interface InventoryMovement {
  id: string
  product_id: string | null
  movement_type: 'manual_adjustment' | 'order_sale' | 'restock' | 'return' | 'damage'
  quantity_change: number
  note: string | null
  created_by: string | null
  created_at: string
}

export interface Coupon {
  id: string
  code: string
  type: 'percent' | 'fixed'
  value: number
  minimum_subtotal: number
  is_active: boolean
  expires_at: string | null
  created_at: string
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'converted' | 'dead'
export type LeadSource = 'organic' | 'agent_prospected' | 'referral' | 'social'
export type OutreachType = 'email' | 'sms' | 'call' | 'note'
export type OutreachSentBy = 'agent' | 'human'

export interface OfficeRefillLead {
  id: string
  business_name: string
  contact_name: string | null
  email: string
  phone: string | null
  business_type: string | null
  estimated_budget: string | null
  message: string | null
  status: LeadStatus
  lead_source: LeadSource
  address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  website: string | null
  notes: string | null
  agent_notes: string | null
  created_at: string
  updated_at: string
  // joined
  outreach_log?: OutreachLogEntry[]
}

export interface OutreachLogEntry {
  id: string
  lead_id: string
  type: OutreachType
  subject: string | null
  body_summary: string | null
  sent_at: string
  sent_by: OutreachSentBy
  response_received_at: string | null
  resend_message_id: string | null
  notes: string | null
  created_at: string
}

// Cart types
export interface CartItem {
  id: string
  product_id: string
  name: string
  slug: string
  image_url: string | null
  retail_price: number
  quantity: number
  inventory_quantity: number
  shipping_eligible: boolean
  delivery_eligible: boolean
  sku: string | null
  // wholesale mode: when true, retail_price holds the wholesale unit price
  // and quantity is number of CASES (each case has case_size units).
  is_wholesale?: boolean
  case_size?: number
}

export interface Cart {
  items: CartItem[]
  fulfillment_method: FulfillmentMethod
  postal_code: string
  coupon_code: string
}

// Checkout request / response
export interface CheckoutRequestBody {
  items: Array<{ product_id: string; quantity: number }>
  fulfillment_method: FulfillmentMethod
  email: string
  postal_code?: string
  coupon_code?: string
  delivery_address?: DeliveryAddress
  loyalty_points_to_redeem?: number
}

export interface PricingSummary {
  subtotal: number
  delivery_fee: number
  shipping_fee: number
  tax_amount: number
  discount_amount: number
  loyalty_redemption_amount: number
  total: number
}

export interface SavedCart {
  id: string
  user_id: string | null
  email: string
  items: CartItem[]
  fulfillment_method: FulfillmentMethod
  recovery_email_sent_at: string | null
  created_at: string
  updated_at: string
}

// Phase 5 — B2B / Office Refill

export type B2BPlan = 'starter' | 'standard' | 'premium'
export type B2BBillingType = 'card' | 'net30'
export type B2BSubscriptionStatus = 'pending' | 'active' | 'past_due' | 'canceled' | 'trialing' | 'paused'
export type B2BMemberRole = 'owner' | 'approver' | 'member'

export interface BusinessAccount {
  id: string
  lead_id: string | null
  business_name: string
  contact_name: string | null
  contact_email: string
  contact_phone: string | null
  business_type: string | null
  billing_address: Record<string, string> | null
  plan_name: B2BPlan
  billing_type: B2BBillingType
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: B2BSubscriptionStatus
  current_period_end: string | null
  delivery_notes: string | null
  status: 'active' | 'suspended' | 'canceled'
  is_wholesale_approved: boolean
  dunning_stage: number
  suspended_at: string | null
  last_failure_at: string | null
  created_at: string
  updated_at: string
  // joined
  members?: BusinessMember[]
  catalog_count?: number
}

export interface B2BPlanItem {
  id: string
  plan_name: B2BPlan
  product_id: string
  quantity: number
  sort_order: number
  created_at: string
  updated_at: string
  // joined
  product?: Product | null
}

export interface B2BOrderRun {
  business_id: string
  run_date: string
  order_id: string | null
  created_at: string
}

export interface B2BInvoiceRun {
  business_id: string
  period_start: string
  stripe_invoice_id: string | null
  created_at: string
}

export interface BusinessMember {
  id: string
  business_id: string
  user_id: string | null
  email: string
  role: B2BMemberRole
  spend_limit: number | null
  invite_token: string | null
  invite_sent_at: string | null
  accepted_at: string | null
  created_at: string
  // joined
  profile?: Profile | null
}

export interface BusinessCatalogItem {
  id: string
  business_id: string
  product_id: string
  custom_price: number | null
  is_active: boolean
  created_at: string
  // joined
  product?: Product | null
}

export interface DeliverySchedule {
  id: string
  business_id: string
  frequency: SubscriptionFrequency
  day_of_week: number | null
  week_of_month: number | null
  time_window: string | null
  delivery_address: DeliveryAddress | null
  notes: string | null
  is_active: boolean
  next_delivery_at: string | null
  last_delivery_at: string | null
  created_at: string
  updated_at: string
}

export interface BusinessInvoice {
  id: string
  business_id: string
  stripe_invoice_id: string | null
  amount_due: number
  amount_paid: number
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void'
  due_date: string | null
  paid_at: string | null
  invoice_pdf_url: string | null
  dunning_attempts: number
  last_dunning_sent_at: string | null
  created_at: string
}

export const B2B_PLANS = {
  starter: {
    name: 'Starter Refill',
    price: 99,
    priceLabel: '$99/mo',
    items: 50,
    frequency: 'Bi-weekly delivery',
    stripePriceEnvKey: 'STRIPE_B2B_STARTER_PRICE_ID',
  },
  standard: {
    name: 'Standard Refill',
    price: 199,
    priceLabel: '$199/mo',
    items: 120,
    frequency: 'Weekly delivery',
    stripePriceEnvKey: 'STRIPE_B2B_STANDARD_PRICE_ID',
  },
  premium: {
    name: 'Premium Refill',
    price: 399,
    priceLabel: '$399/mo',
    items: null,
    frequency: '2x weekly delivery',
    stripePriceEnvKey: 'STRIPE_B2B_PREMIUM_PRICE_ID',
  },
} as const

// Phase 4 — Growth & Retention

export interface FlashSale {
  id: string
  title: string
  badge_label: string
  product_id: string | null
  category_id: string | null
  discount_type: 'percent' | 'fixed'
  discount_value: number
  max_discount: number | null
  starts_at: string
  ends_at: string
  is_active: boolean
  created_at: string
}

export type PromotionType = 'bogo' | 'category_percent' | 'spend_threshold' | 'free_shipping'

export interface Promotion {
  id: string
  name: string
  description: string | null
  type: PromotionType
  conditions: Record<string, unknown>
  starts_at: string | null
  ends_at: string | null
  is_active: boolean
  usage_count: number
  max_uses: number | null
  created_at: string
}

export type ReferralStatus = 'pending' | 'credited' | 'expired'

export interface Referral {
  id: string
  referrer_id: string
  referred_user_id: string | null
  referred_email: string | null
  status: ReferralStatus
  referrer_credit: number
  referred_credit: number
  created_at: string
  credited_at: string | null
}

export type PaymentTerms = 'prepaid' | 'cash' | 'net15' | 'net30' | 'net60' | 'other'

export interface Supplier {
  id: string
  name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  website: string | null
  payment_terms: PaymentTerms
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface InventoryLot {
  id: string
  product_id: string
  supplier_id: string | null
  quantity_received: number
  quantity_remaining: number
  unit_cost: number
  total_cost: number
  lot_number: string | null
  expiration_date: string | null
  received_at: string
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // joined
  product?: Pick<Product, 'id' | 'name' | 'sku'> | null
  supplier?: Pick<Supplier, 'id' | 'name'> | null
}

export type StockRequestStatus = 'new' | 'reviewing' | 'sourced' | 'declined'
export type StockRequestSource = 'storefront' | 'product_page' | 'search' | 'admin'

export interface StockRequest {
  id: string
  product_id: string | null
  product_name: string
  brand: string | null
  size: string | null
  notes: string | null
  email: string | null
  phone: string | null
  source: StockRequestSource
  status: StockRequestStatus
  request_count: number
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export type SubscriptionFrequency = 'weekly' | 'biweekly' | 'monthly'
export type SubscriptionStatus = 'active' | 'paused' | 'canceled'

export interface Subscription {
  id: string
  user_id: string
  product_id: string
  quantity: number
  frequency: SubscriptionFrequency
  fulfillment_method: FulfillmentMethod
  delivery_address: DeliveryAddress | null
  postal_code: string | null
  status: SubscriptionStatus
  next_order_at: string
  last_order_at: string | null
  last_order_id: string | null
  discount_percent: number
  created_at: string
  updated_at: string
  // joined
  product?: Product | null
}
