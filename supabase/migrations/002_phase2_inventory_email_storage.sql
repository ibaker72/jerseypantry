-- ============================================================
-- Phase 2: Oversell Protection + Email Tracking + Storage
-- ============================================================

-- Atomic inventory reservation function.
-- Returns the number of products that COULD NOT be fully reserved.
-- Caller should check: if result > 0, abort checkout.
create or replace function public.reserve_inventory(
  p_items jsonb  -- array of {product_id, quantity}
)
returns table (
  product_id   uuid,
  requested    int,
  available    int,
  reserved     boolean
)
language plpgsql
security definer
as $$
declare
  item        jsonb;
  v_product_id uuid;
  v_requested  int;
  v_available  int;
begin
  -- Lock rows for update to prevent concurrent race
  for item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (item->>'product_id')::uuid;
    v_requested  := (item->>'quantity')::int;

    -- Lock and read current quantity
    select inventory_quantity into v_available
    from public.products
    where id = v_product_id
    for update;

    if v_available >= v_requested then
      -- Decrement inventory atomically
      update public.products
      set inventory_quantity = inventory_quantity - v_requested
      where id = v_product_id;

      return query select v_product_id, v_requested, v_available, true;
    else
      -- Not enough stock — do NOT decrement
      return query select v_product_id, v_requested, coalesce(v_available, 0), false;
    end if;
  end loop;
end;
$$;

-- Restore inventory (used on order cancel/refund)
create or replace function public.restore_inventory(
  p_items jsonb  -- array of {product_id, quantity}
)
returns void
language plpgsql
security definer
as $$
declare
  item jsonb;
begin
  for item in select * from jsonb_array_elements(p_items)
  loop
    update public.products
    set inventory_quantity = inventory_quantity + (item->>'quantity')::int
    where id = (item->>'product_id')::uuid;
  end loop;
end;
$$;

-- ============================================================
-- Track email notifications
-- ============================================================
create table if not exists public.email_logs (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid references public.orders(id) on delete cascade,
  to_email    text not null,
  subject     text not null,
  type        text not null,  -- 'order_confirmation', 'status_update', 'low_stock_alert'
  resend_id   text,           -- Resend message ID
  sent_at     timestamptz not null default now()
);

alter table public.email_logs enable row level security;
create policy "email_logs_admin_all" on public.email_logs
  for all using (public.is_admin());

-- ============================================================
-- Supabase Storage: product-images bucket migration hint
-- Run this in Supabase Dashboard > Storage > New bucket:
--   Name: product-images
--   Public: true
-- Then add policy in Storage > Policies:
--   SELECT: true (public read)
--   INSERT/UPDATE/DELETE: is_admin()
-- ============================================================
