-- ============================================================
-- Phase 5: Office Refill / B2B
-- Business accounts, custom catalogs, delivery schedules,
-- Stripe Billing subscriptions, multi-user accounts
-- ============================================================

-- ── Business Accounts ────────────────────────────────────────
create table if not exists public.business_accounts (
  id                     uuid primary key default gen_random_uuid(),
  -- origin
  lead_id                uuid references public.office_refill_leads(id) on delete set null,
  -- company info
  business_name          text not null,
  contact_name           text,
  contact_email          text not null,
  contact_phone          text,
  business_type          text,
  billing_address        jsonb,                   -- {line1,city,state,postal_code}
  -- plan
  plan_name              text not null default 'starter'
                           check (plan_name in ('starter','standard','premium')),
  billing_type           text not null default 'card'
                           check (billing_type in ('card','net30')),
  -- stripe
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  subscription_status    text not null default 'pending'
                           check (subscription_status in (
                             'pending','active','past_due','canceled','trialing','paused'
                           )),
  current_period_end     timestamptz,
  -- delivery
  delivery_notes         text,
  -- status
  status                 text not null default 'active'
                           check (status in ('active','suspended','canceled')),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists ba_stripe_customer_idx      on public.business_accounts(stripe_customer_id);
create index if not exists ba_stripe_subscription_idx  on public.business_accounts(stripe_subscription_id);
create index if not exists ba_contact_email_idx        on public.business_accounts(contact_email);

alter table public.business_accounts enable row level security;

create policy "ba_admin_all" on public.business_accounts
  for all using (public.is_admin());
create policy "ba_member_read" on public.business_accounts
  for select using (
    exists (
      select 1 from public.business_members bm
      where bm.business_id = id and bm.user_id = auth.uid()
    )
  );

create trigger ba_updated_at
  before update on public.business_accounts
  for each row execute function update_updated_at_column();

-- ── Business Members (multi-user accounts) ───────────────────
create table if not exists public.business_members (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.business_accounts(id) on delete cascade,
  user_id       uuid references auth.users(id) on delete cascade,
  email         text not null,
  role          text not null default 'member'
                  check (role in ('owner','approver','member')),
  spend_limit   numeric(10,2),                  -- null = unlimited
  invite_token  text unique,                     -- null once accepted
  invite_sent_at timestamptz,
  accepted_at   timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists bm_business_idx on public.business_members(business_id);
create index if not exists bm_user_idx     on public.business_members(user_id);
create index if not exists bm_email_idx    on public.business_members(email);
create unique index if not exists bm_business_user_uq on public.business_members(business_id, user_id)
  where user_id is not null;

alter table public.business_members enable row level security;

create policy "bm_admin_all" on public.business_members
  for all using (public.is_admin());
create policy "bm_owner_manage" on public.business_members
  for all using (
    exists (
      select 1 from public.business_members me
      where me.business_id = business_id
        and me.user_id = auth.uid()
        and me.role = 'owner'
    )
  );
create policy "bm_own_read" on public.business_members
  for select using (user_id = auth.uid());
create policy "bm_service_insert" on public.business_members
  for insert with check (true);
create policy "bm_accept_invite" on public.business_members
  for update using (email = (select email from auth.users where id = auth.uid()));

-- ── Business Catalogs (custom product lists + pricing) ───────
create table if not exists public.business_catalogs (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references public.business_accounts(id) on delete cascade,
  product_id      uuid not null references public.products(id) on delete cascade,
  custom_price    numeric(10,2),                 -- null = use retail_price
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  unique (business_id, product_id)
);

create index if not exists bc_business_idx on public.business_catalogs(business_id);
create index if not exists bc_product_idx  on public.business_catalogs(product_id);

alter table public.business_catalogs enable row level security;

create policy "bc_admin_all" on public.business_catalogs
  for all using (public.is_admin());
create policy "bc_member_read" on public.business_catalogs
  for select using (
    exists (
      select 1 from public.business_members bm
      where bm.business_id = business_id and bm.user_id = auth.uid()
    )
  );
create policy "bc_service_write" on public.business_catalogs
  for all with check (true);

-- ── Delivery Schedules ────────────────────────────────────────
create table if not exists public.delivery_schedules (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references public.business_accounts(id) on delete cascade,
  -- recurrence
  frequency      text not null check (frequency in ('weekly','biweekly','monthly')),
  day_of_week    int  check (day_of_week between 0 and 6),  -- 0=Sun … 6=Sat (for weekly/biweekly)
  week_of_month  int  check (week_of_month between 1 and 4), -- for monthly
  time_window    text,                            -- e.g. "9am-12pm"
  -- delivery details
  delivery_address jsonb,
  notes          text,
  is_active      boolean not null default true,
  next_delivery_at timestamptz,
  last_delivery_at timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists ds_business_idx      on public.delivery_schedules(business_id);
create index if not exists ds_next_delivery_idx on public.delivery_schedules(next_delivery_at)
  where is_active = true;

alter table public.delivery_schedules enable row level security;

create policy "ds_admin_all" on public.delivery_schedules
  for all using (public.is_admin());
create policy "ds_member_read" on public.delivery_schedules
  for select using (
    exists (
      select 1 from public.business_members bm
      where bm.business_id = business_id and bm.user_id = auth.uid()
    )
  );

create trigger ds_updated_at
  before update on public.delivery_schedules
  for each row execute function update_updated_at_column();

-- ── Orders: link to business account ─────────────────────────
alter table public.orders
  add column if not exists business_account_id uuid references public.business_accounts(id) on delete set null;

create index if not exists orders_business_account_idx on public.orders(business_account_id);

-- ── Helper: get business for current user ────────────────────
create or replace function public.get_my_business_id()
returns uuid language sql security definer stable as $$
  select business_id from public.business_members
  where user_id = auth.uid()
  limit 1;
$$;

-- ── Net-30 invoice tracker ───────────────────────────────────
create table if not exists public.business_invoices (
  id                  uuid primary key default gen_random_uuid(),
  business_id         uuid not null references public.business_accounts(id) on delete cascade,
  stripe_invoice_id   text unique,
  amount_due          numeric(10,2) not null,
  amount_paid         numeric(10,2) not null default 0,
  status              text not null default 'open'
                        check (status in ('draft','open','paid','uncollectible','void')),
  due_date            timestamptz,
  paid_at             timestamptz,
  invoice_pdf_url     text,
  created_at          timestamptz not null default now()
);

create index if not exists bi_business_idx on public.business_invoices(business_id);

alter table public.business_invoices enable row level security;

create policy "bi_admin_all" on public.business_invoices
  for all using (public.is_admin());
create policy "bi_member_read" on public.business_invoices
  for select using (
    exists (
      select 1 from public.business_members bm
      where bm.business_id = business_id and bm.user_id = auth.uid()
    )
  );
create policy "bi_service_write" on public.business_invoices
  for all with check (true);
