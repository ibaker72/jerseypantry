-- ============================================================
-- Phase 4: Growth & Retention
-- Flash Sales, Promotions, Referrals, Subscriptions
-- ============================================================

-- ── Flash Sales ───────────────────────────────────────────────
-- Time-limited discounts on a product, a category, or site-wide
create table if not exists public.flash_sales (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  badge_label      text not null default 'FLASH SALE',
  product_id       uuid references public.products(id) on delete cascade,
  category_id      uuid references public.categories(id) on delete cascade,
  -- null product_id + null category_id = site-wide
  discount_type    text not null check (discount_type in ('percent', 'fixed')),
  discount_value   numeric(10,2) not null check (discount_value > 0),
  max_discount     numeric(10,2),          -- cap for percent discounts
  starts_at        timestamptz not null default now(),
  ends_at          timestamptz not null,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

create index if not exists flash_sales_ends_at_idx  on public.flash_sales(ends_at);
create index if not exists flash_sales_product_idx  on public.flash_sales(product_id);
create index if not exists flash_sales_category_idx on public.flash_sales(category_id);

alter table public.flash_sales enable row level security;

create policy "flash_sales_public_read" on public.flash_sales
  for select using (is_active = true and now() between starts_at and ends_at);
create policy "flash_sales_admin_all" on public.flash_sales
  for all using (public.is_admin());

-- ── Promotions (auto-applied rules) ───────────────────────────
-- BOGO, category-wide %, spend threshold discounts, free shipping
create table if not exists public.promotions (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  type         text not null check (type in ('bogo', 'category_percent', 'spend_threshold', 'free_shipping')),
  -- conditions JSONB structure:
  --   bogo:             { "buy_qty": 2, "get_qty": 1, "product_id": "..." }
  --   category_percent: { "category_id": "...", "percent": 15 }
  --   spend_threshold:  { "min_spend": 75, "discount_fixed": 10 }
  --   free_shipping:    { "min_spend": 50 }
  conditions   jsonb not null default '{}',
  starts_at    timestamptz,
  ends_at      timestamptz,
  is_active    boolean not null default true,
  usage_count  int not null default 0,
  max_uses     int,
  created_at   timestamptz not null default now()
);

alter table public.promotions enable row level security;

create policy "promotions_public_read" on public.promotions
  for select using (
    is_active = true
    and (starts_at is null or now() >= starts_at)
    and (ends_at   is null or now() <= ends_at)
  );
create policy "promotions_admin_all" on public.promotions
  for all using (public.is_admin());

-- ── Referrals ─────────────────────────────────────────────────
alter table public.profiles
  add column if not exists referral_code text unique,
  add column if not exists store_credit  numeric(10,2) not null default 0,
  add column if not exists referred_by   uuid references public.profiles(id) on delete set null;

create index if not exists profiles_referral_code_idx on public.profiles(referral_code);

create table if not exists public.referrals (
  id               uuid primary key default gen_random_uuid(),
  referrer_id      uuid not null references public.profiles(id) on delete cascade,
  referred_user_id uuid references public.profiles(id) on delete set null,
  referred_email   text,
  status           text not null default 'pending' check (status in ('pending', 'credited', 'expired')),
  referrer_credit  numeric(10,2) not null default 10.00,
  referred_credit  numeric(10,2) not null default 5.00,
  created_at       timestamptz not null default now(),
  credited_at      timestamptz
);

create index if not exists referrals_referrer_idx on public.referrals(referrer_id);
create index if not exists referrals_referred_user_idx on public.referrals(referred_user_id);

alter table public.referrals enable row level security;

create policy "referrals_own_read" on public.referrals
  for select using (referrer_id = auth.uid() or referred_user_id = auth.uid() or public.is_admin());
create policy "referrals_admin_all" on public.referrals
  for all using (public.is_admin());
create policy "referrals_service_insert" on public.referrals
  for insert with check (true);

-- Auto-generate unique referral code on profile creation
create or replace function public.generate_referral_code()
returns trigger language plpgsql security definer as $$
declare
  v_code text;
  v_exists boolean;
begin
  loop
    -- 6-char alphanumeric, uppercase
    v_code := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    select exists(select 1 from public.profiles where referral_code = v_code) into v_exists;
    exit when not v_exists;
  end loop;
  new.referral_code := v_code;
  return new;
end;
$$;

drop trigger if exists profiles_generate_referral_code on public.profiles;
create trigger profiles_generate_referral_code
  before insert on public.profiles
  for each row
  when (new.referral_code is null)
  execute function public.generate_referral_code();

-- Backfill existing profiles that have no referral code
do $$
declare
  v_profile record;
  v_code    text;
  v_exists  boolean;
begin
  for v_profile in select id from public.profiles where referral_code is null loop
    loop
      v_code := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 6));
      select exists(select 1 from public.profiles where referral_code = v_code) into v_exists;
      exit when not v_exists;
    end loop;
    update public.profiles set referral_code = v_code where id = v_profile.id;
  end loop;
end;
$$;

-- Atomic store credit deduction (returns false if insufficient)
create or replace function public.use_store_credit(
  p_user_id uuid,
  p_amount  numeric
)
returns boolean language plpgsql security definer as $$
declare
  v_balance numeric;
begin
  select store_credit into v_balance
  from public.profiles
  where id = p_user_id
  for update;

  if v_balance is null or v_balance < p_amount then
    return false;
  end if;

  update public.profiles
  set store_credit = store_credit - p_amount
  where id = p_user_id;

  return true;
end;
$$;

-- Restore store credit (on order cancel / expiry)
create or replace function public.restore_store_credit(
  p_user_id uuid,
  p_amount  numeric
)
returns void language plpgsql security definer as $$
begin
  if p_user_id is null or p_amount <= 0 then return; end if;
  update public.profiles
  set store_credit = store_credit + p_amount
  where id = p_user_id;
end;
$$;

-- Add store credit to an existing user (referral reward, admin grant, etc.)
create or replace function public.add_store_credit(
  p_user_id uuid,
  p_amount  numeric
)
returns void language plpgsql security definer as $$
begin
  update public.profiles
  set store_credit = store_credit + p_amount
  where id = p_user_id;
end;
$$;

-- ── Subscriptions (auto-refill) ───────────────────────────────
create table if not exists public.subscriptions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  product_id         uuid not null references public.products(id) on delete cascade,
  quantity           int not null default 1 check (quantity > 0),
  frequency          text not null check (frequency in ('weekly', 'biweekly', 'monthly')),
  fulfillment_method text not null default 'local_delivery' check (fulfillment_method in ('local_delivery', 'pickup', 'shipping')),
  delivery_address   jsonb,
  postal_code        text,
  status             text not null default 'active' check (status in ('active', 'paused', 'canceled')),
  next_order_at      timestamptz not null,
  last_order_at      timestamptz,
  last_order_id      uuid references public.orders(id) on delete set null,
  discount_percent   int not null default 10,  -- subscribe & save discount
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx      on public.subscriptions(user_id);
create index if not exists subscriptions_next_order_idx   on public.subscriptions(next_order_at) where status = 'active';
create index if not exists subscriptions_product_id_idx   on public.subscriptions(product_id);

alter table public.subscriptions enable row level security;

create policy "subscriptions_own_all" on public.subscriptions
  for all using (user_id = auth.uid() or public.is_admin());
create policy "subscriptions_service_update" on public.subscriptions
  for update using (true);

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function update_updated_at_column();

-- ── Abandoned cart: track recovery email sent ─────────────────
alter table public.saved_carts
  add column if not exists recovery_email_sent_at timestamptz;

-- ── Promo usage increment ─────────────────────────────────────
create or replace function public.increment_promotion_usage(p_promotion_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.promotions
  set usage_count = usage_count + 1
  where id = p_promotion_id;
end;
$$;

-- ── Orders: track store credit redemption ─────────────────────
alter table public.orders
  add column if not exists store_credit_redeemed  numeric(10,2) not null default 0,
  add column if not exists promotion_ids          uuid[]        not null default '{}';
