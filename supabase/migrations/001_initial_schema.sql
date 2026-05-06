-- ============================================================
-- My Corner Store — Initial Schema
-- ============================================================

-- Helper: updated_at trigger function
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- 1. profiles
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  role        text not null default 'customer'
                constraint profiles_role_check check (role in ('customer', 'admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function update_updated_at_column();

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2. categories
-- ============================================================
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  description text,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- 3. products
-- ============================================================
create table public.products (
  id                   uuid primary key default gen_random_uuid(),
  category_id          uuid references public.categories(id) on delete set null,
  name                 text not null,
  slug                 text not null unique,
  description          text,
  sku                  text unique,
  barcode              text,
  brand                text,
  size                 text,
  unit                 text,
  image_url            text,
  wholesale_cost       numeric(10,2) not null default 0,
  retail_price         numeric(10,2) not null,
  compare_at_price     numeric(10,2),
  inventory_quantity   int not null default 0,
  reorder_threshold    int not null default 5,
  is_active            boolean not null default true,
  is_featured          boolean not null default false,
  is_bundle            boolean not null default false,
  shipping_eligible    boolean not null default true,
  delivery_eligible    boolean not null default true,
  badges               text[] not null default '{}',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index products_category_id_idx on public.products(category_id);
create index products_slug_idx on public.products(slug);
create index products_is_active_idx on public.products(is_active);

create trigger products_updated_at
  before update on public.products
  for each row execute function update_updated_at_column();

-- ============================================================
-- 4. customers
-- ============================================================
create table public.customers (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete set null,
  email      text not null,
  phone      text,
  first_name text,
  last_name  text,
  created_at timestamptz not null default now()
);

create index customers_email_idx on public.customers(email);
create index customers_user_id_idx on public.customers(user_id);

-- ============================================================
-- 5. addresses
-- ============================================================
create table public.addresses (
  id                    uuid primary key default gen_random_uuid(),
  customer_id           uuid references public.customers(id) on delete cascade,
  line1                 text not null,
  line2                 text,
  city                  text,
  state                 text,
  postal_code           text,
  country               text not null default 'US',
  delivery_instructions text,
  created_at            timestamptz not null default now()
);

-- ============================================================
-- 6. orders
-- ============================================================
create table public.orders (
  id                         uuid primary key default gen_random_uuid(),
  order_number               text unique not null,
  customer_id                uuid references public.customers(id) on delete set null,
  email                      text not null,
  phone                      text,
  status                     text not null default 'pending'
                               constraint orders_status_check check (
                                 status in ('pending','paid','preparing','out_for_delivery','completed','canceled','refunded')
                               ),
  fulfillment_method         text not null
                               constraint orders_fulfillment_method_check check (
                                 fulfillment_method in ('local_delivery','pickup','shipping')
                               ),
  subtotal                   numeric(10,2) not null default 0,
  delivery_fee               numeric(10,2) not null default 0,
  shipping_fee               numeric(10,2) not null default 0,
  tax_amount                 numeric(10,2) not null default 0,
  discount_amount            numeric(10,2) not null default 0,
  total                      numeric(10,2) not null default 0,
  stripe_checkout_session_id text,
  stripe_payment_intent_id   text,
  delivery_address           jsonb,
  notes                      text,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

create index orders_customer_id_idx on public.orders(customer_id);
create index orders_status_idx on public.orders(status);
create index orders_created_at_idx on public.orders(created_at desc);

create trigger orders_updated_at
  before update on public.orders
  for each row execute function update_updated_at_column();

-- ============================================================
-- 7. order_items
-- ============================================================
create table public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  product_id   uuid references public.products(id) on delete set null,
  product_name text not null,
  sku          text,
  quantity     int not null,
  unit_price   numeric(10,2) not null,
  line_total   numeric(10,2) not null,
  created_at   timestamptz not null default now()
);

create index order_items_order_id_idx on public.order_items(order_id);

-- ============================================================
-- 8. delivery_zones
-- ============================================================
create table public.delivery_zones (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  postal_code           text not null,
  city                  text,
  delivery_fee          numeric(10,2) not null default 4.99,
  free_delivery_minimum numeric(10,2) not null default 50.00,
  is_active             boolean not null default true,
  created_at            timestamptz not null default now()
);

create index delivery_zones_postal_code_idx on public.delivery_zones(postal_code);

-- ============================================================
-- 9. inventory_movements
-- ============================================================
create table public.inventory_movements (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid references public.products(id) on delete cascade,
  movement_type   text not null
                    constraint inventory_movements_type_check check (
                      movement_type in ('manual_adjustment','order_sale','restock','return','damage')
                    ),
  quantity_change int not null,
  note            text,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now()
);

create index inventory_movements_product_id_idx on public.inventory_movements(product_id);

-- ============================================================
-- 10. coupons
-- ============================================================
create table public.coupons (
  id               uuid primary key default gen_random_uuid(),
  code             text unique not null,
  type             text not null
                     constraint coupons_type_check check (type in ('percent','fixed')),
  value            numeric(10,2) not null,
  minimum_subtotal numeric(10,2) not null default 0,
  is_active        boolean not null default true,
  expires_at       timestamptz,
  created_at       timestamptz not null default now()
);

-- ============================================================
-- 11. office_refill_leads
-- ============================================================
create table public.office_refill_leads (
  id               uuid primary key default gen_random_uuid(),
  business_name    text not null,
  contact_name     text,
  email            text not null,
  phone            text,
  business_type    text,
  estimated_budget text,
  message          text,
  status           text not null default 'new',
  created_at       timestamptz not null default now()
);

-- ============================================================
-- RLS
-- ============================================================

alter table public.profiles            enable row level security;
alter table public.categories          enable row level security;
alter table public.products            enable row level security;
alter table public.customers           enable row level security;
alter table public.addresses           enable row level security;
alter table public.orders              enable row level security;
alter table public.order_items         enable row level security;
alter table public.delivery_zones      enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.coupons             enable row level security;
alter table public.office_refill_leads enable row level security;

-- Admin helper
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- categories: public read active only
create policy "categories_public_read" on public.categories
  for select using (is_active = true);
create policy "categories_admin_all" on public.categories
  for all using (public.is_admin());

-- products: public read active only
create policy "products_public_read" on public.products
  for select using (is_active = true);
create policy "products_admin_all" on public.products
  for all using (public.is_admin());

-- delivery_zones: public read active only
create policy "delivery_zones_public_read" on public.delivery_zones
  for select using (is_active = true);
create policy "delivery_zones_admin_all" on public.delivery_zones
  for all using (public.is_admin());

-- coupons: only admin
create policy "coupons_admin_all" on public.coupons
  for all using (public.is_admin());

-- profiles: users read/update own, admin all
create policy "profiles_own_read" on public.profiles
  for select using (id = auth.uid());
create policy "profiles_own_update" on public.profiles
  for update using (id = auth.uid());
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin());

-- customers: own or admin
create policy "customers_own_read" on public.customers
  for select using (user_id = auth.uid() or public.is_admin());
create policy "customers_admin_all" on public.customers
  for all using (public.is_admin());
create policy "customers_insert_authenticated" on public.customers
  for insert with check (true);

-- orders: own or admin
create policy "orders_own_read" on public.orders
  for select using (
    customer_id in (select id from public.customers where user_id = auth.uid())
    or public.is_admin()
  );
create policy "orders_admin_all" on public.orders
  for all using (public.is_admin());
create policy "orders_service_insert" on public.orders
  for insert with check (true);

-- order_items: accessible if order is accessible
create policy "order_items_read" on public.order_items
  for select using (
    order_id in (
      select id from public.orders
      where customer_id in (select id from public.customers where user_id = auth.uid())
    ) or public.is_admin()
  );
create policy "order_items_admin_all" on public.order_items
  for all using (public.is_admin());
create policy "order_items_service_insert" on public.order_items
  for insert with check (true);

-- addresses
create policy "addresses_own_read" on public.addresses
  for select using (
    customer_id in (select id from public.customers where user_id = auth.uid())
    or public.is_admin()
  );
create policy "addresses_admin_all" on public.addresses
  for all using (public.is_admin());

-- inventory_movements: admin only
create policy "inventory_movements_admin_all" on public.inventory_movements
  for all using (public.is_admin());
create policy "inventory_movements_service_insert" on public.inventory_movements
  for insert with check (true);

-- office_refill_leads: public insert, admin read/manage
create policy "office_leads_public_insert" on public.office_refill_leads
  for insert with check (true);
create policy "office_leads_admin_all" on public.office_refill_leads
  for all using (public.is_admin());
