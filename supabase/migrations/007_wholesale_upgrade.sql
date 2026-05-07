-- ============================================================
-- Phase 7: Digital Wholesaler Upgrade
-- Wholesale inventory buffer, dispatch orders, reserve RPC
-- ============================================================

-- ── Wholesale Inventory ───────────────────────────────────────
create table if not exists public.wholesale_inventory (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid not null references public.products(id) on delete cascade,
  wholesaler_name   text not null default 'Local Wholesaler',
  wholesaler_stock  int  not null default 0,
  buffer_pct        numeric(4,2) not null default 0.20,  -- 20 % safety buffer
  wholesale_unit    text not null default 'Unit',        -- "Case of 12"
  unit_count        int  not null default 1,
  weight_lbs        numeric(8,2) not null default 0,
  volume_cubic_ft   numeric(8,2) not null default 0,
  last_verified_at  timestamptz default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique(product_id)
);

create index if not exists wi_product_idx on public.wholesale_inventory(product_id);

alter table public.wholesale_inventory enable row level security;

create policy "wi_admin_all" on public.wholesale_inventory
  for all using (public.is_admin());
create policy "wi_member_read" on public.wholesale_inventory
  for select using (
    exists (
      select 1 from public.business_members bm
      where bm.user_id = auth.uid()
    )
  );
create policy "wi_service_write" on public.wholesale_inventory
  for all with check (true);

create trigger wi_updated_at
  before update on public.wholesale_inventory
  for each row execute function update_updated_at_column();

-- ── Inventory Reservations ────────────────────────────────────
create table if not exists public.inventory_reservations (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid not null references public.products(id) on delete cascade,
  order_id          uuid,
  reserved_quantity int  not null check (reserved_quantity > 0),
  status            text not null default 'active'
                      check (status in ('active','fulfilled','expired','cancelled')),
  expires_at        timestamptz not null default (now() + interval '24 hours'),
  created_at        timestamptz not null default now()
);

create index if not exists ir_product_idx    on public.inventory_reservations(product_id);
create index if not exists ir_order_idx      on public.inventory_reservations(order_id);
create index if not exists ir_active_idx     on public.inventory_reservations(product_id, status, expires_at)
  where status = 'active';

alter table public.inventory_reservations enable row level security;

create policy "ir_admin_all" on public.inventory_reservations
  for all using (public.is_admin());
create policy "ir_service_all" on public.inventory_reservations
  for all with check (true);

-- ── Dispatch Orders ───────────────────────────────────────────
create table if not exists public.dispatch_orders (
  id                    uuid primary key default gen_random_uuid(),
  order_id              uuid not null references public.orders(id) on delete cascade,
  total_weight_lbs      numeric(8,2) not null default 0,
  distance_miles        numeric(8,2),
  delivery_type         text not null
                          check (delivery_type in ('self_delivery','courier')),
  courier_provider      text
                          check (courier_provider in ('doordash','uber')),
  courier_quote_id      text,
  courier_fee           numeric(10,2),
  courier_tracking_url  text,
  driver_name           text,
  status                text not null default 'pending_pickup'
                          check (status in (
                            'pending_pickup',
                            'picked_up_from_wholesaler',
                            'out_for_delivery',
                            'delivered',
                            'driver_assigned',
                            'at_wholesaler',
                            'courier_dispatched'
                          )),
  pickup_confirmed_at   timestamptz,
  out_for_delivery_at   timestamptz,
  delivered_at          timestamptz,
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists do_order_idx  on public.dispatch_orders(order_id);
create index if not exists do_status_idx on public.dispatch_orders(status);

alter table public.dispatch_orders enable row level security;

create policy "do_admin_all" on public.dispatch_orders
  for all using (public.is_admin());
create policy "do_service_all" on public.dispatch_orders
  for all with check (true);

create trigger do_updated_at
  before update on public.dispatch_orders
  for each row execute function update_updated_at_column();

-- ── reserve_wholesale_stock RPC ───────────────────────────────
-- Checks inventory_reservations and applies a configurable safety buffer
-- before creating a new reservation.  Returns a JSONB result object.
create or replace function public.reserve_wholesale_stock(
  p_product_id  uuid,
  p_quantity    int,
  p_order_id    uuid default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_rec                  public.wholesale_inventory%rowtype;
  v_existing_reserved    int;
  v_buffered_available   int;
  v_actual_available     int;
begin
  -- Lock the wholesale_inventory row for this product
  select * into v_rec
  from   public.wholesale_inventory
  where  product_id = p_product_id
  for    update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error',   'Product not found in wholesale catalog'
    );
  end if;

  -- Sum active, non-expired reservations
  select coalesce(sum(reserved_quantity), 0)
  into   v_existing_reserved
  from   public.inventory_reservations
  where  product_id = p_product_id
    and  status     = 'active'
    and  expires_at > now();

  -- Apply safety buffer: only offer floor(stock * (1 - buffer_pct))
  v_buffered_available := floor(v_rec.wholesaler_stock * (1 - v_rec.buffer_pct));
  v_actual_available   := v_buffered_available - v_existing_reserved;

  if v_actual_available < p_quantity then
    return jsonb_build_object(
      'success',   false,
      'error',     'Insufficient wholesale stock after safety buffer',
      'available', greatest(v_actual_available, 0)
    );
  end if;

  -- Create the reservation
  insert into public.inventory_reservations(
    product_id, order_id, reserved_quantity, status, expires_at
  ) values (
    p_product_id,
    p_order_id,
    p_quantity,
    'active',
    now() + interval '24 hours'
  );

  return jsonb_build_object(
    'success',   true,
    'reserved',  p_quantity,
    'remaining', v_actual_available - p_quantity
  );
end;
$$;

-- ── expire_stale_reservations (maintenance helper) ────────────
create or replace function public.expire_stale_reservations()
returns int
language plpgsql
security definer
as $$
declare
  v_count int;
begin
  update public.inventory_reservations
  set    status = 'expired'
  where  status = 'active'
    and  expires_at <= now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
