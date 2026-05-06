-- ============================================================
-- Phase 3: Customer Accounts, Loyalty Points, Abandoned Carts
-- ============================================================

-- ── Profiles: add loyalty points + phone ─────────────────────
alter table public.profiles
  add column if not exists loyalty_points int not null default 0,
  add column if not exists phone          text;

-- ── Orders: link to auth user + loyalty tracking ─────────────
alter table public.orders
  add column if not exists user_id                   uuid references auth.users(id) on delete set null,
  add column if not exists loyalty_points_earned     int           not null default 0,
  add column if not exists loyalty_points_redeemed   int           not null default 0,
  add column if not exists loyalty_redemption_amount numeric(10,2) not null default 0;

create index if not exists orders_user_id_idx on public.orders(user_id);

-- ── Saved carts (for abandoned cart recovery) ─────────────────
create table if not exists public.saved_carts (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references auth.users(id) on delete cascade,
  email              text not null,
  items              jsonb not null default '[]',
  fulfillment_method text not null default 'pickup',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists saved_carts_email_idx      on public.saved_carts(email);
create index if not exists saved_carts_updated_at_idx on public.saved_carts(updated_at desc);

alter table public.saved_carts enable row level security;

create policy "saved_carts_own_all" on public.saved_carts
  for all using (user_id = auth.uid() or public.is_admin());
create policy "saved_carts_service_upsert" on public.saved_carts
  for insert with check (true);
create policy "saved_carts_service_update" on public.saved_carts
  for update using (true);

create trigger saved_carts_updated_at
  before update on public.saved_carts
  for each row execute function update_updated_at_column();

-- ── Loyalty helper functions ──────────────────────────────────

-- Award points to a user after successful payment
create or replace function public.award_loyalty_points(
  p_user_id uuid,
  p_points   int
)
returns void
language plpgsql security definer as $$
begin
  update public.profiles
  set loyalty_points = loyalty_points + p_points
  where id = p_user_id;
end;
$$;

-- Deduct points when redeemed at checkout (returns false if insufficient)
create or replace function public.redeem_loyalty_points(
  p_user_id uuid,
  p_points   int
)
returns boolean
language plpgsql security definer as $$
declare
  v_balance int;
begin
  select loyalty_points into v_balance
  from public.profiles
  where id = p_user_id
  for update;

  if v_balance is null or v_balance < p_points then
    return false;
  end if;

  update public.profiles
  set loyalty_points = loyalty_points - p_points
  where id = p_user_id;

  return true;
end;
$$;

-- Restore redeemed points if checkout session expires
create or replace function public.restore_loyalty_points(
  p_user_id uuid,
  p_points   int
)
returns void
language plpgsql security definer as $$
begin
  if p_user_id is null or p_points = 0 then return; end if;
  update public.profiles
  set loyalty_points = loyalty_points + p_points
  where id = p_user_id;
end;
$$;

-- ── RLS updates for new orders columns ───────────────────────
-- Existing orders policies already cover the new columns since
-- they operate at the row level, no additional policies needed.

-- Allow users to read their own orders by user_id (supplement customer_id path)
drop policy if exists "orders_own_read" on public.orders;
create policy "orders_own_read" on public.orders
  for select using (
    user_id = auth.uid()
    or customer_id in (select id from public.customers where user_id = auth.uid())
    or public.is_admin()
  );

-- ── Addresses: allow own insert/delete ───────────────────────
drop policy if exists "addresses_own_insert" on public.addresses;
create policy "addresses_own_insert" on public.addresses
  for insert with check (
    customer_id in (select id from public.customers where user_id = auth.uid())
    or public.is_admin()
  );

drop policy if exists "addresses_own_delete" on public.addresses;
create policy "addresses_own_delete" on public.addresses
  for delete using (
    customer_id in (select id from public.customers where user_id = auth.uid())
    or public.is_admin()
  );
