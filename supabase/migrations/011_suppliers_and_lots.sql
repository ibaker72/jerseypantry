-- ============================================================
-- Suppliers + Inventory Lots
-- Track who you buy from, and the batches you receive
-- (with cost + expiration). Receiving a lot bumps product stock
-- atomically and writes an inventory_movement.
-- ============================================================

-- ── suppliers ─────────────────────────────────────────────────
create table if not exists public.suppliers (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  contact_name    text,
  email           text,
  phone           text,
  address         text,
  website         text,
  payment_terms   text not null default 'prepaid'
                    check (payment_terms in ('prepaid', 'cash', 'net15', 'net30', 'net60', 'other')),
  notes           text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists suppliers_is_active_idx on public.suppliers(is_active);

create trigger suppliers_updated_at
  before update on public.suppliers
  for each row execute function update_updated_at_column();

alter table public.suppliers enable row level security;

create policy "suppliers_admin_all" on public.suppliers
  for all using (public.is_admin());

-- ── inventory_lots ────────────────────────────────────────────
-- Each lot is one delivery batch. We track received vs remaining
-- so admins can see which lot is depleting first (FIFO) and what
-- expires when.
create table if not exists public.inventory_lots (
  id                  uuid primary key default gen_random_uuid(),
  product_id          uuid not null references public.products(id) on delete cascade,
  supplier_id         uuid references public.suppliers(id) on delete set null,
  quantity_received   int not null check (quantity_received > 0),
  quantity_remaining  int not null check (quantity_remaining >= 0),
  unit_cost           numeric(10,2) not null default 0 check (unit_cost >= 0),
  total_cost          numeric(10,2) not null default 0 check (total_cost >= 0),
  lot_number          text,
  expiration_date     date,
  received_at         timestamptz not null default now(),
  notes               text,
  created_by          uuid references auth.users(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists inventory_lots_product_id_idx     on public.inventory_lots(product_id);
create index if not exists inventory_lots_supplier_id_idx    on public.inventory_lots(supplier_id);
create index if not exists inventory_lots_expiration_idx     on public.inventory_lots(expiration_date)
  where expiration_date is not null;
create index if not exists inventory_lots_remaining_idx      on public.inventory_lots(quantity_remaining)
  where quantity_remaining > 0;

create trigger inventory_lots_updated_at
  before update on public.inventory_lots
  for each row execute function update_updated_at_column();

alter table public.inventory_lots enable row level security;

create policy "inventory_lots_admin_all" on public.inventory_lots
  for all using (public.is_admin());

-- ── receive_lot RPC ───────────────────────────────────────────
-- One call to record a received shipment. Wraps:
--   1. insert into inventory_lots
--   2. increment products.inventory_quantity
--   3. log an inventory_movement
create or replace function public.receive_lot(
  p_product_id       uuid,
  p_supplier_id      uuid,
  p_quantity         int,
  p_unit_cost        numeric,
  p_lot_number       text,
  p_expiration_date  date,
  p_notes            text
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_lot_id    uuid;
  v_user_id   uuid;
  v_total     numeric;
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'quantity must be > 0';
  end if;

  v_user_id := auth.uid();
  v_total   := coalesce(p_unit_cost, 0) * p_quantity;

  insert into public.inventory_lots (
    product_id, supplier_id, quantity_received, quantity_remaining,
    unit_cost, total_cost, lot_number, expiration_date, notes, created_by
  )
  values (
    p_product_id, p_supplier_id, p_quantity, p_quantity,
    coalesce(p_unit_cost, 0), v_total, nullif(p_lot_number, ''),
    p_expiration_date, nullif(p_notes, ''), v_user_id
  )
  returning id into v_lot_id;

  update public.products
  set inventory_quantity = inventory_quantity + p_quantity
  where id = p_product_id;

  -- Best-effort movement log (table from migration 002+).
  begin
    insert into public.inventory_movements (
      product_id, movement_type, quantity_change, note, created_by
    ) values (
      p_product_id, 'restock', p_quantity,
      'Lot ' || v_lot_id::text || coalesce(' · ' || p_notes, ''), v_user_id
    );
  exception
    when undefined_table then null;
    when undefined_column then null;
  end;

  return v_lot_id;
end;
$$;

grant execute on function public.receive_lot(uuid, uuid, int, numeric, text, date, text) to authenticated;
