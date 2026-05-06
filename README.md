# My Corner Store

Your corner store, online. A production-ready MVP for a local convenience store with same-day delivery across North Jersey.

## Tech Stack

- **Next.js 15** — App Router, Server Components
- **TypeScript** — Strict mode
- **Tailwind CSS** + shadcn/ui primitives
- **Supabase** — Database, Auth, RLS
- **Stripe Checkout** — One-time payments
- **Resend** — Email (optional, gracefully disabled if not configured)
- **Vercel** — Deployment target

---

## Setup

### 1. Clone & Install

```bash
git clone <your-repo>
cd my-corner-store
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...           # Optional — email disabled without this
ORDER_NOTIFICATION_EMAIL=hello@yourstore.com
NEXT_PUBLIC_STORE_NAME=My Corner Store
```

### 3. Supabase Setup

1. Create a new Supabase project at supabase.com
2. Copy your project URL and anon key to `.env.local`
3. Copy your service role key to `.env.local` (never expose this to client)

#### Run Migrations

Paste and run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL Editor.

#### Run Seed Data

After migrations, paste and run `supabase/seed.sql` in the Supabase SQL Editor. This creates:
- All 12 product categories
- ~50 realistic starter products
- 8 bundle products
- 16 North Jersey delivery zones
- Coupon code `CORNER10` (10% off)

### 4. Admin User Setup

1. Create a user in Supabase Auth Dashboard
2. Update their profile to admin role:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@yourstore.com';
```

Admin dashboard is at `/admin`.

---

## Stripe Setup

### Webhook Local Testing

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward events to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copy the webhook secret shown (whsec_...) to STRIPE_WEBHOOK_SECRET
```

### Production Webhook

Add webhook endpoint in Stripe Dashboard:
- URL: `https://yoursite.com/api/stripe/webhook`
- Events: `checkout.session.completed`

---

## Running Locally

```bash
npm run dev
```

Admin dashboard: http://localhost:3000/admin

---

## CSV Product Import

Admin -> CSV Import (`/admin/import`)

Required columns: `name, category, sku, wholesale_cost, retail_price, inventory_quantity`

Optional: `description, image_url, barcode, brand, size, unit, shipping_eligible, delivery_eligible, reorder_threshold`

Products are upserted by SKU.

---

## Deployment (Vercel)

Set all environment variables in Vercel Dashboard -> Settings -> Environment Variables.

The `STRIPE_WEBHOOK_SECRET` must match the production webhook endpoint.

---

## Architecture Notes

### Checkout Flow
1. User fills cart -> POST `/api/checkout` validates products server-side
2. Pending order created in Supabase
3. Stripe Checkout session created with `order_id` in metadata
4. On success, webhook marks order paid, decrements inventory

### Tax
Tax is $0 for MVP. TODO: integrate Stripe Tax or NJ tax rate.

---

## Known MVP Limitations

- Tax calculation is $0 (TODO: add Stripe Tax or manual NJ rate)
- No real-time inventory sync
- Office Refill subscription billing not yet implemented (lead form only)
- Product images are URL-based (no upload UI)
- No customer account portal
- No automated email notifications (stub in place)
- Delivery zone management is read-only in admin
