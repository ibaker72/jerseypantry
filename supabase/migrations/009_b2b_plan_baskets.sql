-- ============================================================
-- Phase 7: B2B Plan Baskets, Dunning & Order/Invoice Idempotency
--
-- Adds:
--   • b2b_plan_items   — admin-curated plan tier → product map
--   • b2b_order_runs   — idempotency for recurring delivery orders
--   • b2b_invoice_runs — idempotency for net30 invoice issuance
--   • dunning columns on business_accounts and business_invoices
-- ============================================================

-- ── Plan baskets ─────────────────────────────────────────────
create table if not exists public.b2b_plan_items (
  id          uuid primary key default gen_random_uuid(),
  plan_name   text not null check (plan_name in ('starter','standard','premium')),
  product_id  uuid not null references public.products(id) on delete restrict,
  quantity    int  not null check (quantity > 0),
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (plan_name, product_id)
);

create index if not exists bpi_plan_idx on public.b2b_plan_items(plan_name);

alter table public.b2b_plan_items enable row level security;

create policy "bpi_admin_all" on public.b2b_plan_items
  for all using (public.is_admin()) with check (public.is_admin());
create policy "bpi_public_read" on public.b2b_plan_items
  for select using (true);

create trigger bpi_updated_at
  before update on public.b2b_plan_items
  for each row execute function update_updated_at_column();

-- ── Dunning state ────────────────────────────────────────────
alter table public.business_accounts
  add column if not exists dunning_stage    smallint    not null default 0,
  add column if not exists suspended_at     timestamptz,
  add column if not exists last_failure_at  timestamptz;

alter table public.business_invoices
  add column if not exists dunning_attempts     smallint    not null default 0,
  add column if not exists last_dunning_sent_at timestamptz;

-- ── Order generation idempotency ─────────────────────────────
create table if not exists public.b2b_order_runs (
  business_id  uuid not null references public.business_accounts(id) on delete cascade,
  run_date     date not null,
  order_id     uuid references public.orders(id) on delete set null,
  created_at   timestamptz not null default now(),
  primary key (business_id, run_date)
);

create index if not exists bor_run_date_idx on public.b2b_order_runs(run_date);

alter table public.b2b_order_runs enable row level security;
create policy "bor_admin_all" on public.b2b_order_runs
  for all using (public.is_admin()) with check (public.is_admin());

-- ── Net30 invoice issuance idempotency ───────────────────────
create table if not exists public.b2b_invoice_runs (
  business_id        uuid not null references public.business_accounts(id) on delete cascade,
  period_start       date not null,
  stripe_invoice_id  text,
  created_at         timestamptz not null default now(),
  primary key (business_id, period_start)
);

alter table public.b2b_invoice_runs enable row level security;
create policy "bir_admin_all" on public.b2b_invoice_runs
  for all using (public.is_admin()) with check (public.is_admin());

-- ── Seed sample baskets (idempotent) ─────────────────────────
-- Picks the cheapest N active products per plan as starter content.
-- Admins can edit via /admin/b2b/plans.
do $$
declare
  starter_qty  int := 5;
  standard_qty int := 12;
  premium_qty  int := 25;
  rec record;
begin
  if not exists (select 1 from public.b2b_plan_items) then
    for rec in
      select id from public.products where is_active = true
      order by retail_price asc limit starter_qty
    loop
      insert into public.b2b_plan_items (plan_name, product_id, quantity)
      values ('starter', rec.id, 2)
      on conflict do nothing;
    end loop;

    for rec in
      select id from public.products where is_active = true
      order by retail_price asc limit standard_qty
    loop
      insert into public.b2b_plan_items (plan_name, product_id, quantity)
      values ('standard', rec.id, 4)
      on conflict do nothing;
    end loop;

    for rec in
      select id from public.products where is_active = true
      order by retail_price asc limit premium_qty
    loop
      insert into public.b2b_plan_items (plan_name, product_id, quantity)
      values ('premium', rec.id, 6)
      on conflict do nothing;
    end loop;
  end if;
end $$;
